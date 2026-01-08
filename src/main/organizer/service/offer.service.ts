import { FirebaseService } from '@/lib/firebase/firebase.service';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { S3Service } from '@/lib/s3/s3.service';
import { GetOffersDto2 } from '@/main/admin/dto/getOffer.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Readable } from 'stream';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { UpdateOfferDto } from '../dto/update-offer.dto';
import { generateQRCodeBuffer } from '../helps/qrCode';
import { 
  format, 
  isValid, 
  subDays,
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  subWeeks, 
  subMonths, 
  eachDayOfInterval, 
  eachMonthOfInterval 
} from 'date-fns';
import { RedemptionFilterDto, RedemptionPeriod } from '@/main/admin/dto/admin.activity';
@Injectable()
export class OfferService {
  constructor(
    private prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly firebase: FirebaseService,
  ) {}
  // ** Create offer by organizer
  async createOffer(userId: string, dto: CreateOfferDto) {
    // 1️⃣ Find the business profile
    const business = await this.prisma.client.businessProfile.findUnique({
      where: { ownerId: userId },
    });
    if (!business) throw new NotFoundException('No business profile found');

    const offer = await this.prisma.client.offer.create({
      data: {
        title: dto.title,
        description: dto.description,
        code: dto.code,
        expiredsAt: dto.expiresAt,
        businessId: business.id,
        isActive: true,
        qrCodeUrl: null,
      },
    });

    const allPremiumUser = await this.prisma.client.user.findMany({
      where: { subscriptionStatus: 'ACTIVE' },
      select: { fcmToken: true, id: true },
    });

    const fcmArray = allPremiumUser
      .map((u) => u.fcmToken)
      .filter((token): token is string => !!token);

    if (fcmArray.length > 0) {
      await this.firebase.sendPushNotification(fcmArray, dto.title, dto.code);
    }

    const notification = await this.prisma.client.notification.create({
      data: {
        type: 'OFFER',
        title: dto.title,
        message: dto.description ?? dto.code,
        meta: {
          offerId: offer.id,
          businessId: business.id,
        },
      },
    });

    if (allPremiumUser.length > 0) {
      await this.prisma.client.userNotification.createMany({
        data: allPremiumUser.map((u) => ({
          userId: u.id,
          notificationId: notification.id,
        })),
        skipDuplicates: true,
      });
    }

    return offer;
  }

  //** find arrpove offer only...
  async findApprovedOffers(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });
    if (!user || user.role !== 'USER') {
      throw new BadRequestException('Only regular users can get offers');
    }

    return this.prisma.client.offer.findMany({
      where: { status: 'APPROVED' },
      include: { business: true },
    });
  }
  // find oranizer offer
  async findMyOffers(userId: string, filter: GetOffersDto2) {
    const { status, page = 1, limit = 10, search } = filter;
    const skip = (page - 1) * limit;

    // Find the user's business profile
    const business = await this.prisma.client.businessProfile.findUnique({
      where: { ownerId: userId },
    });

    if (!business) {
      throw new NotFoundException(
        `You don't have a business profile yet, so you cannot create offers`,
      );
    }

    // Build the where filter
    const where: any = {
      businessId: business.id,
    };

    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }
    // Fetch offers with pagination
    return this.prisma.client.offer.findMany({
      skip,
      take: limit,
      where,
      include: { business: true },
    });
  }

  async findReviews(userId: string, filter: GetOffersDto2) {
    const { status, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    // Find the user's business profile
    const business = await this.prisma.client.businessProfile.findUnique({
      where: { ownerId: userId },
    });

    if (!business) {
      throw new NotFoundException(
        `You don't have a business profile yet, so you cannot create offers`,
      );
    }

    // Build the where filter
    const where: any = {
      businessId: business.id,
    };

    if (status) {
      where.status = status;
    }

    // Fetch offers with pagination
    return this.prisma.client.review.findMany({
      skip,
      take: limit,
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
  //** find one offer
  async findOne(userId: string, id: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });
    if (!user || user.role !== 'USER') {
      throw new BadRequestException('Only regular users can get offers');
    }
    const offer = await this.prisma.client.offer.findUnique({
      where: { id },
      include: { business: true },
    });
    if (!offer) throw new NotFoundException(`Offer with ID ${id} not found`);
    return offer;
  }
  // update offer....
  async updateOffer(userId: string, offerId: string, dto: UpdateOfferDto) {
    // find the business profile of the logged-in user
    const business = await this.prisma.client.businessProfile.findUnique({
      where: { ownerId: userId },
    });
    if (!business) {
      throw new NotFoundException(
        `You don't have a business profile yet, so you cannot update offers`,
      );
    }
    const offer = await this.prisma.client.offer.findFirst({
      where: {
        id: offerId,
        businessId: business.id,
      },
    });
    if (!offer) throw new NotFoundException('Offer not found or not yours');

    return this.prisma.client.offer.update({
      where: { id: offerId },
      data: dto,
    });
  }
  //* delete offer
  async deleteOffer(userId: string, offerId: string) {
    const business = await this.prisma.client.businessProfile.findUnique({
      where: { ownerId: userId },
    });
    if (!business) {
      throw new NotFoundException(
        `You don't have a business profile yet, so you cannot delete offers`,
      );
    }
    const offer = await this.prisma.client.offer.findFirst({
      where: {
        id: offerId,
        businessId: business.id,
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found or not yours');
    }

    //* delete the offer
    await this.prisma.client.offer.delete({
      where: { id: offerId },
    });

    return null;
  }

  async approveUserOfferClaimed(redemtionId: string) {
    const redemption = await this.prisma.client.reedemaOffer.findFirst({
      where: { id: redemtionId },
    });

    if (!redemption) {
      throw new NotFoundException('Redemption not found');
    }

    if (redemption.isOrganizedApproved) {
      throw new BadRequestException('Already approved');
    }

    //  Approve redemption
    const updatedRedemption = await this.prisma.client.reedemaOffer.update({
      where: { id: redemtionId },
      data: {
        isOrganizedApproved: true,
      },
    });

    // Create notification
    await this.prisma.client.notification.create({
      data: {
        type: 'OFFER_REDEMPTION_APPROVED',
        title: 'Offer Approved 🎉',
        message: 'Your offer redemption has been approved successfully.',
        meta: {
          redemptionId: updatedRedemption.id,
          offerId: updatedRedemption.offerId,
        },
        users: {
          create: {
            userId: updatedRedemption.userId,
          },
        },
      },
    });

    return updatedRedemption;
  }


async getRedemptionGrowth(
  userId: string,
  period: RedemptionPeriod,
) {
  const today = new Date();

  let startDate: Date;
  let endDate: Date;
  let dateIntervals: Date[];

  const business = await this.prisma.client.businessProfile.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  });

  if (!business) {
    return [];
  }

  switch (period) {
    case RedemptionPeriod.WEEKLY:
      startDate = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      endDate = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      dateIntervals = eachDayOfInterval({ start: startDate, end: endDate });
      break;

    case RedemptionPeriod.MONTHLY:
      startDate = startOfMonth(subMonths(today, 1));
      endDate = endOfMonth(subMonths(today, 1));
      dateIntervals = eachDayOfInterval({ start: startDate, end: endDate });
      break;

    case RedemptionPeriod.ALL_TIME:
      const firstRedemption =
        await this.prisma.client.reedemaOffer.findFirst({
          where: {
            bussinessId: business.id,
            redeemedAt: { not: null },
          },
          orderBy: { redeemedAt: 'asc' },
          select: { redeemedAt: true },
        });

      if (!firstRedemption?.redeemedAt) {
        startDate = startOfMonth(today);
      } else {
        startDate = startOfMonth(firstRedemption.redeemedAt);
      }

      endDate = endOfMonth(today);
      dateIntervals = eachMonthOfInterval({ start: startDate, end: endDate });
      break;

    default:
      startDate = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      endDate = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      dateIntervals = eachDayOfInterval({ start: startDate, end: endDate });
  }

  const logs = await this.prisma.client.reedemaOffer.findMany({
    where: {
      bussinessId: business.id,
      redeemedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      redeemedAt: true,
    },
  });

  return {
    period,
    startDate,
    endDate,
    totalRedemptions: logs.length,
    dataPoints: dateIntervals.map((date) => ({
      date,
      count: logs.filter(
        (l) =>
          l.redeemedAt &&
          l.redeemedAt.toDateString() === date.toDateString(),
      ).length,
    })),
  };
}

}
