import { HandleError } from '@/common/error/handle-error.decorator';
import { successResponse, TResponse } from '@/common/utils/response.util';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DateTime } from 'luxon';

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

    const [monthlyPlan, biannualPlan, yearlyPlan] =
      await this.prismaService.$transaction([
        this.prismaService.subscriptionPlan.findFirst({
          where: {
            billingPeriod: 'MONTHLY',
            isActive: true,
          },
          orderBy,
        }),
        this.prismaService.subscriptionPlan.findFirst({
          where: {
            billingPeriod: 'BIANNUAL',
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
        biannualPlan,
        yearlyPlan,
      },
      'Plans fetched successfully',
    );
  }

  @HandleError('Error getting subscription status')
  async getCurrentSubscriptionStatus(userId: string): Promise<TResponse<any>> {
    // Get latest active subscription
    const userSubscription =
      await this.prismaService.userSubscription.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: {
          plan: true,
        },
        orderBy: [
          { updatedAt: Prisma.SortOrder.desc },
          { createdAt: Prisma.SortOrder.desc },
        ],
      });

    if (!userSubscription) {
      return successResponse(
        {
          status: 'NONE',
          message: 'No active or past subscription found.',
          canRenew: true,
          period: {
            startedAt: null,
            endedAt: null,
            remainingDays: null,
          },
          plan: null,
        },
        'No subscription found',
      );
    }

    const now = DateTime.now();
    const end = DateTime.fromJSDate(userSubscription.planEndedAt);
    const isExpired = end < now;

    // Compute formatted output
    const status =
      userSubscription.status === 'ACTIVE' && !isExpired
        ? 'ACTIVE'
        : isExpired
          ? 'EXPIRED'
          : userSubscription.status;

    const canRenew = status === 'EXPIRED' || status === 'FAILED';

    return successResponse(
      {
        status,
        canRenew,
        plan: {
          title: userSubscription.plan.title,
          price: userSubscription.plan.priceCents,
          currency: userSubscription.plan.currency,
          billingPeriod: userSubscription.plan.billingPeriod,
        },
        period: {
          startedAt: DateTime.fromJSDate(
            userSubscription.planStartedAt,
          ).toISODate(),
          endedAt: end.toISODate(),
          remainingDays: Math.max(end.diff(now, 'days').days, 0).toFixed(0),
        },
        message:
          status === 'ACTIVE'
            ? `Your ${userSubscription.plan.title} plan is active until ${end.toFormat('DDD')}.`
            : status === 'EXPIRED'
              ? `Your subscription expired on ${end.toFormat('DDD')}.`
              : 'No active subscription found.',
      },
      'Subscription status fetched successfully',
    );
  }
}
