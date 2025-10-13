import { HandleError } from '@/common/error/handle-error.decorator';
import { successResponse } from '@/common/utils/response.util';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly prismaService: PrismaService) {}

  @HandleError('Error getting plans for user')
  async getPlansForUser() {
    const orderBy = [
      { updatedAt: Prisma.SortOrder.desc },
      { createdAt: Prisma.SortOrder.desc },
    ];

    const [monthlyPlan, yearlyPlan] = await this.prismaService.$transaction([
      this.prismaService.subscriptionPlan.findFirst({
        where: {
          billingPeriod: 'MONTHLY',
          isActive: true,
        },
        orderBy,
      }),
      this.prismaService.subscriptionPlan.findFirst({
        where: {
          billingPeriod: 'YEARLY',
          isActive: true,
        },
        orderBy,
      }),
    ]);

    this.logger.log('Plans fetched successfully');

    return successResponse(
      {
        monthlyPlan,
        yearlyPlan,
      },
      'Plans fetched successfully',
    );
  }
}
