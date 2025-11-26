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

@Injectable()
export class OfferService {
  constructor(
    private prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly firebase: FirebaseService,
  ) {}
  // ** Create offer by organizer
  async createOffer(userId: string, dto: CreateOfferDto) {
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
      },
    });

    const redeemUrl = `${process.env.SERVER_URL}/offers/scan/${offer.code}`;
    const qrBuffer = await generateQRCodeBuffer(redeemUrl);

    const file: Express.Multer.File = {
      fieldname: 'file',
      originalname: `offer-${offer.id}.png`,
      encoding: '7bit',
      mimetype: 'image/png',
      size: qrBuffer.length,
      buffer: qrBuffer,
      destination: '',
      filename: `offer-${offer.id}.png`,
      path: '',
      stream: Readable.from(qrBuffer),
    };

    const uploaded = await this.s3Service.uploadFile(file);

    const updatedOffer = await this.prisma.client.offer.update({
      where: { id: offer.id },
      data: { qrCodeUrl: uploaded?.url ?? null },
    });

    //* get all users who is primum  and get thire fcm token for firebase notifiction
    const allPremiumUser = await this.prisma.client.user.findMany({
      where: {
        subscriptionStatus: 'ACTIVE',
      },
      select: {
        fcmToken: true,
        id: true,
      },
    });
    const fcmArray: string[] = [];
    //* this loop will push all fcm token to an array and then it will passs for notifications
    for (const user of allPremiumUser) {
      fcmArray.push(user.fcmToken as string);
    }
    await this.firebase.sendPushNotification(fcmArray, dto.title, dto.code);

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

    // * Create UserNotification entries
    await this.prisma.client.userNotification.createMany({
      data: allPremiumUser.map((u) => ({
        userId: u.id,
        notificationId: notification.id,
      })),
      skipDuplicates: true,
    });
    return updatedOffer;
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
}
