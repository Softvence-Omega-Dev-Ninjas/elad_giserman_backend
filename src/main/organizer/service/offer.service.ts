import { PrismaService } from '@/lib/prisma/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { UpdateOfferDto } from '../dto/update-offer.dto';
import { generateQRCodeBuffer } from '../helps/qrCode';
import { S3Service } from '@/lib/s3/s3.service';
import { Readable } from 'stream';
import { FirebaseService } from '@/lib/firebase/firebase.service';

@Injectable()
export class OfferService {
  constructor(
    private prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly firebase: FirebaseService,
  ) {}
  // ** Create offer by organizer
  async createOffer(userId: string, dto: CreateOfferDto) {
    const business = await this.prisma.businessProfile.findUnique({
      where: { ownerId: userId },
    });

    if (!business) throw new NotFoundException('No business profile found');

    const offer = await this.prisma.offer.create({
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

    const updatedOffer = await this.prisma.offer.update({
      where: { id: offer.id },
      data: { qrCodeUrl: uploaded?.url ?? null },
    });

    //* get all users who is primum  and get thire fcm token for firebase notifiction
    const allPremiumUser = await this.prisma.user.findMany({
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

    const notification = await this.prisma.notification.create({
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
    await this.prisma.userNotification.createMany({
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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'USER') {
      throw new BadRequestException('Only regular users can get offers');
    }

    return this.prisma.offer.findMany({
      where: { status: 'APPROVED' },
      include: { business: true },
    });
  }
  // find oranizer offer
  async findMyOffers(userId: string) {
    // find the business profile of the logged-in user
    const business = await this.prisma.businessProfile.findUnique({
      where: { ownerId: userId },
    });

    if (!business) {
      throw new NotFoundException(
        `You don't have a business profile yet, so you cannot create offers`,
      );
    }

    return this.prisma.offer.findMany({
      where: { business: { id: business.id } },
      include: { business: true },
    });
  }

  //** find one offer
  async findOne(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'USER') {
      throw new BadRequestException('Only regular users can get offers');
    }
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: { business: true },
    });
    if (!offer) throw new NotFoundException(`Offer with ID ${id} not found`);
    return offer;
  }
  // update offer....
  async updateOffer(userId: string, offerId: string, dto: UpdateOfferDto) {
    // find the business profile of the logged-in user
    const business = await this.prisma.businessProfile.findUnique({
      where: { ownerId: userId },
    });
    if (!business) {
      throw new NotFoundException(
        `You don't have a business profile yet, so you cannot update offers`,
      );
    }
    const offer = await this.prisma.offer.findFirst({
      where: {
        id: offerId,
        businessId: business.id,
      },
    });
    if (!offer) throw new NotFoundException('Offer not found or not yours');

    return this.prisma.offer.update({
      where: { id: offerId },
      data: dto,
    });
  }
  //* delete offer
  async deleteOffer(userId: string, offerId: string) {
    const business = await this.prisma.businessProfile.findUnique({
      where: { ownerId: userId },
    });
    if (!business) {
      throw new NotFoundException(
        `You don't have a business profile yet, so you cannot delete offers`,
      );
    }
    const offer = await this.prisma.offer.findFirst({
      where: {
        id: offerId,
        businessId: business.id,
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found or not yours');
    }

    //* delete the offer
    await this.prisma.offer.delete({
      where: { id: offerId },
    });

    return null;
  }
}
