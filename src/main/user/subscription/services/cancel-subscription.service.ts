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
    // Fetch subscription
    const subscription =
      await this.prismaService.client.userSubscription.findFirst({
        where: { userId, status: { in: ['ACTIVE', 'PENDING'] } },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        include: { plan: true },
      });

    const stripeSubscriptionId = subscription?.stripeSubscriptionId;

    // Cancel immediately on Stripe if exists
    if (stripeSubscriptionId) {
      try {
        await this.stripeService.cancelSubscription({
          subscriptionId: stripeSubscriptionId,
          atPeriodEnd: false,
        });
        this.logger.log(
          `Stripe subscription ${stripeSubscriptionId} cancelled`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to cancel Stripe subscription: ${err.message}`,
        );
      }
    }

    // Update subscription if exists
    if (subscription) {
      await this.prismaService.client.userSubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELED',
          planEndedAt: new Date(),
        },
      });
    }

    // Always update user
    await this.prismaService.client.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'CANCELED',
        currentPlan: undefined,
        memberShip: 'FREE',
      },
    });

    this.logger.log(`User ${userId} subscription status updated to FREE`);

    return successResponse(null, 'Subscription cancelled successfully');
  }
}
