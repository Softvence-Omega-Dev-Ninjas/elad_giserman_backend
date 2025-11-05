import { PrismaService } from '@/lib/prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOfferDto } from '../dto/create-offer.dto';

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
}
