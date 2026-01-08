import { PrismaService } from '@/lib/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

import { AdminUpdateOfferDto } from '../dto/admin-update-offer.dto';
import { AdminActivity } from '@prisma';
import { AdminActivityDto } from '../dto/admin.activity';

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

  async createAdminActivityLog(dto: AdminActivityDto) {
    const existingRecord = await this.prisma.client.adminActivity.findFirst();

    if (existingRecord) {
      const res = await this.prisma.client.adminActivity.update({
        where: {
          id: existingRecord.id,
        },
        data: {
          ...dto,
        },
      });
      return res;
    } else {
      // Create a new record
      const res = await this.prisma.client.adminActivity.create({
        data: {
          ...dto,
        },
      });
      return res;
    }
  }

  async getAdminActivityLogs() {
    const records = await this.prisma.client.adminActivity.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!records.length) {
      throw new NotFoundException('No records found');
    }

    return records;
  }
}
