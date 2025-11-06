import { PrismaService } from '@/lib/prisma/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { UpdateOfferDto } from '../dto/update-offer.dto';

@Injectable()
export class OfferService {
  constructor(private prisma: PrismaService) {}

  async createOffer(userId: string, dto: CreateOfferDto) {
    // find the business profile of the logged-in user
    const business = await this.prisma.businessProfile.findUnique({
      where: { ownerId: userId },
    });

    if (!business) {
      throw new NotFoundException(
        `You don't have a business profile yet, so you cannot create offers`,
      );
    }

    // create the offer and link it to the user's business
    return this.prisma.offer.create({
      data: {
        ...dto,
        businessId: business.id,
      },
    });
  }

  // find arrpove offer only...
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
  // find one offer
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
  // delete offer
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

    // delete the offer
    await this.prisma.offer.delete({
      where: { id: offerId },
    });

    return null;
  }
}
