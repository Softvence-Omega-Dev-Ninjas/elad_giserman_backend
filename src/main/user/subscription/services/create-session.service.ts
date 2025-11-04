import { ENVEnum } from '@/common/enum/env.enum';
import { HandleError } from '@/common/error/handle-error.decorator';
import { successResponse, TResponse } from '@/common/utils/response.util';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { StripeService } from '@/lib/stripe/stripe.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CreateSessionService {
  private readonly logger = new Logger(CreateSessionService.name);
  private readonly frontendBase;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly stripeService: StripeService,
    private readonly config: ConfigService,
  ) {
    this.frontendBase = this.config.getOrThrow<string>(ENVEnum.FRONTEND_BASE);
  }

  // Utility to add months to a JS Date
  private addMonths(date: Date, months: number) {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);

    // handle month overflow (e.g., Jan 31 + 1 month -> Feb 28/29)
    if (d.getDate() !== day) {
      d.setDate(0); // go to last day of previous month
    }
    return d;
  }

  @HandleError('Failed to create checkout session', 'Check out session')
  async createCheckOutSession(
    userId: string,
    planId: string,
  ): Promise<TResponse<any>> {
    this.logger.log(
      `Creating checkout session for user ${userId} with plan ${planId}`,
    );

    // Load plan
    const plan = await this.prismaService.subscriptionPlan.findUniqueOrThrow({
      where: { id: planId },
    });

    // Load user
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { id: userId },
    });

    // Determine priceId from plan
    const priceId = plan.stripePriceId;
    if (!priceId) {
      throw new Error('Subscription plan is not linked to a Stripe price');
    }

    // Build success / cancel URLs
    const successUrl = `${this.frontendBase}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${this.frontendBase}/billing/cancel`;

    // Create checkout session via StripeService
    const session = await this.stripeService.createCheckoutSession({
      userId,
      priceId,
      successUrl,
      cancelUrl,
      metadata: {
        userId,
        planId,
        planTitle: plan.title,
        email: user.email,
        name: user.name ?? user.username,
        stripeProductId: plan.stripeProductId,
        stripePriceId: plan.stripePriceId,
      },
    });

    // Compute plan start/end
    const planStartedAt = new Date();
    let monthsToAdd = 1;
    switch (plan.billingPeriod) {
      case 'MONTHLY':
        monthsToAdd = 1;
        break;
      case 'BIANNUAL':
        monthsToAdd = 6;
        break;
      case 'YEARLY':
        monthsToAdd = 12;
        break;
      default:
        monthsToAdd = 1;
    }
    const planEndedAt = this.addMonths(planStartedAt, monthsToAdd);

    // Persist a pending UserSubscription record referencing this checkout session
    // Use the session.id as stripeTransactionId fallback when payment_intent may not exist yet
    const stripeTxnId = (session.payment_intent as string) ?? session.id;

    const userSubscription = await this.prismaService.userSubscription.create({
      data: {
        userId,
        planId: plan.id,
        stripeSubscriptionId: null,
        stripeTransactionId: stripeTxnId,
        status: 'PENDING',
        planStartedAt,
        planEndedAt,
      },
    });

    this.logger.log(
      `Created pending userSubscription ${userSubscription.id} (stripeTxn=${stripeTxnId}) for user ${userId}`,
    );

    // Return session info to the caller (frontend will redirect using session.id or session.url)
    return successResponse({
      message: 'Checkout session created',
      data: {
        checkoutSessionId: session.id,
        checkoutUrl: (session as any).url ?? null,
        userSubscriptionId: userSubscription.id,
      },
    });
  }

  @HandleError('Failed to cancel subscription', 'Cancel subscription')
  async cancelSubscription(userId: string): Promise<TResponse<any>> {
    this.logger.log(`Canceling subscription for user ${userId}`);

    // Find the most recent active (or trialing) subscription for the user
    const subscription = await this.prismaService.userSubscription.findFirst({
      where: {
        userId,
        // consider both ACTIVE and TRIALING as "subscribed" depending on your business rules
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      this.logger.log(`No active subscription found for user ${userId}`);
      return successResponse({
        message: 'No active subscription found',
        data: null,
      });
    }

    // If we have a Stripe subscription id, try to schedule cancellation through Stripe
    if (subscription.stripeSubscriptionId) {
      try {
        const stripeSub = await this.stripeService.cancelSubscription({
          subscriptionId: subscription.stripeSubscriptionId,
          atPeriodEnd: true, // schedule to cancel at period end
        });

        // stripe returns cancel_at (unix seconds) for scheduled cancels
        // or a deleted subscription object for immediate cancels.
        // Normalize to a JS Date if available.
        const cancelAtUnix = stripeSub.cancel_at;

        let newPlanEndedAt: Date | null = null;
        if (typeof cancelAtUnix === 'number') {
          newPlanEndedAt = new Date(cancelAtUnix * 1000);
        }

        // Update the DB record to mark cancellation scheduled (set status to CANCELED, update planEndedAt)
        const updated = await this.prismaService.userSubscription.update({
          where: { id: subscription.id },
          data: {
            status: 'CANCELED',
            ...(newPlanEndedAt ? { planEndedAt: newPlanEndedAt } : {}),
          },
        });

        this.logger.log(
          `Scheduled cancellation for userSubscription ${subscription.id} at ${newPlanEndedAt}`,
        );

        return successResponse({
          message: 'Subscription scheduled to cancel at period end',
          data: { userSubscriptionId: updated.id, cancelAt: newPlanEndedAt },
        });
      } catch (err) {
        this.logger.error('Stripe cancelSubscription failed', err as any);
        throw err;
      }
    }

    // If no stripeSubscriptionId is present, simply mark the DB subscription as canceled
    const updatedLocal = await this.prismaService.userSubscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        planEndedAt: new Date(), // cancel immediately in DB
      },
    });

    this.logger.log(
      `Marked userSubscription ${subscription.id} cancelled (no stripeSubscriptionId)`,
    );

    return successResponse({
      message: 'Subscription cancelled locally',
      data: { userSubscriptionId: updatedLocal.id },
    });
  }
}
