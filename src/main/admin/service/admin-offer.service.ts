import { PrismaService } from '@/lib/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

import { AdminUpdateOfferDto } from '../dto/admin-update-offer.dto';

@Injectable()
export class AdminOfferService {
  constructor(private prisma: PrismaService) {}

  //*get all pending offers
  async getPendingOffers() {
    return this.prisma.client.offer.findMany({
      where: { status: 'PENDING' },
      include: { business: true },
    });
  }

  // approve or reject an offer
  async updateOfferStatus(offerId: string, dto: AdminUpdateOfferDto) {
    const offer = await this.prisma.client.offer.findUnique({
      where: { id: offerId },
    });
    if (!offer)
      throw new NotFoundException(`Offer with ID ${offerId} not found`);

    return this.prisma.client.offer.update({
      where: { id: offerId },
      data: { status: dto.status },
    });
  }

  // get all offers regardless of status
  async getAllOffers(page: number, limit: number, status: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) {
      where.status = status;
    }
    return this.prisma.client.offer.findMany({
      skip: skip,
      take: limit,
      where,
      include: {
        business: true,
      },
    });
  }
}
