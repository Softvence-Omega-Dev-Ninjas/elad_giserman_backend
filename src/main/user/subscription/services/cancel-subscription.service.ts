import { AppError } from '@/common/error/handle-error.app';
import { HandleError } from '@/common/error/handle-error.decorator';
import { successResponse, TResponse } from '@/common/utils/response.util';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { StripeService } from '@/lib/stripe/stripe.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CancelSubscriptionService {
  private readonly logger = new Logger(CancelSubscriptionService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  @HandleError('Failed to cancel subscription')
  async cancelSubscriptionImmediately(userId: string): Promise<TResponse<any>> {
    const subscription = await this.prismaService.userSubscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new AppError(400, 'No active subscription found');
    }

    const stripeSubscriptionId = subscription.stripeSubscriptionId;

    // Cancel immediately on Stripe
    await this.stripeService.cancelSubscription({
      subscriptionId: stripeSubscriptionId,
      atPeriodEnd: false,
    });

    // Update local DB subscription & user
    await this.prismaService.$transaction([
      this.prismaService.userSubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELED',
          planEndedAt: new Date(),
        },
      }),
      this.prismaService.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'CANCELED',
          currentPlan: undefined,
          memberShip: 'FREE',
        },
      }),
    ]);

    this.logger.log(
      `Subscription ${stripeSubscriptionId} for user ${userId} cancelled immediately`,
    );

    return successResponse(null, 'Subscription cancelled successfully');
  }
}
