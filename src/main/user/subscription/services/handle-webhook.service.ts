import { AppError } from '@/common/error/handle-error.app';
import { HandleError } from '@/common/error/handle-error.decorator';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { StripeService } from '@/lib/stripe/stripe.service';
import { StripePaymentMetadata } from '@/lib/stripe/stripe.types';
import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class HandleWebhookService {
  private readonly logger = new Logger(HandleWebhookService.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {}

  @HandleError('Failed to handle Stripe webhook', 'Subscription')
  async handleWebhook(signature: string, rawBody: Buffer) {
    // 1. Verify webhook signature
    let event: Stripe.Event;
    try {
      event = this.stripeService.constructWebhookEvent(rawBody, signature);

      this.logger.log(`Received Stripe event: ${event.type}`);

      // 2. Process the event
      await this.handleEvent(event);
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      throw new AppError(400, 'Invalid webhook signature');
    }
  }

  private async handleEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'setup_intent.succeeded':
        await this.handleSetupIntentSucceeded(
          event.data.object as Stripe.SetupIntent,
        );
        break;

      case 'setup_intent.setup_failed':
      case 'setup_intent.canceled':
        await this.handleSetupIntentFailed(
          event.data.object as Stripe.SetupIntent,
        );
        break;

      case 'customer.subscription.updated':
        await this.handleCustomerSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'customer.subscription.deleted':
        await this.handleCustomerSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'invoice.paid':
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      default:
        this.logger.log(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  private async handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
    const setupIntentId = setupIntent.id;
    const metadata = setupIntent.metadata as unknown as StripePaymentMetadata;
    const customerId = setupIntent.customer as string;
    this.logger.log(`Handling setup_intent.succeeded for id ${setupIntentId}`);

    const subscription = await this.prisma.userSubscription.findUnique({
      where: { stripeTransactionId: setupIntentId },
    });

    if (!subscription) {
      this.logger.error(
        `Subscription not found for setupIntent ${setupIntentId}. Consider storing stripeSetupIntentId on the subscription or adding subscriptionId into SetupIntent metadata.`,
      );
      return;
    }

    // Idempotent check
    if (subscription.status === 'ACTIVE') {
      this.logger.log(`Subscription ${subscription.id} already active`);
      return;
    }

    try {
      const paymentMethodId = setupIntent.payment_method as string;

      const stripeSub = await this.stripeService.createSubscription({
        customerId,
        priceId: metadata.stripePriceId,
        metadata,
        paymentMethodId,
      });

      await this.prisma.user.update({
        where: { id: subscription.userId },
        data: {
          subscriptionStatus: 'ACTIVE',
          currentPlan: {
            connect: {
              id: subscription.planId,
            },
          },
          stripeDefaultPaymentMethodId: paymentMethodId,
          stripeCustomerId: customerId,
        },
      });

      this.logger.log(
        `Subscription ${subscription.id} activated successfully via SetupIntent for stripe subscription ${stripeSub.id}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to update subscription ${subscription.id} for setupIntent ${setupIntentId}`,
        err,
      );
      throw err;
    }
  }

  private async handleSetupIntentFailed(setupIntent: Stripe.SetupIntent) {
    const setupIntentId = setupIntent.id;
    this.logger.warn(`Handling failed/canceled setup_intent ${setupIntentId}`);

    const subscription = await this.prisma.userSubscription.findUnique({
      where: { stripeTransactionId: setupIntentId },
    });

    if (!subscription) {
      this.logger.error(
        `Subscription not found for failed setupIntent ${setupIntentId}`,
      );
      return;
    }

    try {
      await this.prisma.userSubscription.update({
        where: { id: subscription.id },
        data: { status: 'FAILED', failedAt: new Date() },
      });
      this.logger.warn(
        `SetupIntent failed for subscription ${subscription.id} (setupIntent: ${setupIntentId})`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to update subscription ${subscription.id} for failed setupIntent ${setupIntentId}`,
        err,
      );
      throw err;
    }
  }

  private async handleCustomerSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ) {
    const stripeSubId = subscription.id;
    this.logger.log(
      `customer.subscription.updated: ${stripeSubId} status=${subscription.status}`,
    );

    const local = await this.prisma.userSubscription.findUnique({
      where: { stripeSubscriptionId: stripeSubId },
      include: { plan: true },
    });

    if (!local) {
      this.logger.warn(
        `No local subscription found for stripe subscription ${stripeSubId}`,
      );
      return;
    }

    const updates: any = {};

    // Map stripe->local status
    if (subscription.status === 'active') updates.status = 'ACTIVE';
    else if (subscription.status === 'past_due') updates.status = 'PAST_DUE';
    else if (
      subscription.status === 'canceled' ||
      subscription.status === 'incomplete_expired' ||
      subscription.status === 'unpaid' ||
      subscription.status === 'incomplete'
    )
      updates.status = 'CANCELED';

    // Update cancel_at or planEndedAt if present
    if (subscription.cancel_at)
      updates.planEndedAt = new Date(subscription.cancel_at * 1000);
    if (subscription.ended_at)
      updates.planEndedAt = new Date(subscription.ended_at * 1000);

    if (Object.keys(updates).length) {
      await this.prisma.userSubscription.update({
        where: { id: local.id },
        data: updates,
      });
    }
  }

  private async handleCustomerSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ) {
    const stripeSubId = subscription.id;
    this.logger.log(`customer.subscription.deleted: ${stripeSubId}`);

    const local = await this.prisma.userSubscription.findUnique({
      where: { stripeSubscriptionId: stripeSubId },
    });

    if (!local) {
      this.logger.warn(
        `No local subscription found for deleted stripe subscription ${stripeSubId}`,
      );
      return;
    }

    await this.prisma.userSubscription.update({
      where: { id: local.id },
      data: {
        status: 'CANCELED',
        planEndedAt: subscription.ended_at
          ? new Date(subscription.ended_at * 1000)
          : local.planEndedAt,
      },
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    this.logger.log(`invoice.${invoice.status}: ${invoice.id}`);

    // Extract subscription info safely
    const subDetails = invoice.parent?.subscription_details;
    const subscriptionId = subDetails?.subscription as string | undefined;
    const metadata = subDetails?.metadata as StripePaymentMetadata | undefined;

    if (!subscriptionId || !metadata) {
      this.logger.warn(
        `Invoice ${invoice.id} has no subscription details — skipping.`,
      );
      return;
    }

    const { userId, planId } = metadata;

    // Fetch local subscription
    const localSubscription = await this.prisma.userSubscription.findFirst({
      where: {
        OR: [
          { stripeSubscriptionId: subscriptionId },
          { userId: userId, planId: planId },
        ],
      },
      include: { plan: true },
    });

    if (!localSubscription) {
      this.logger.error(
        `No matching local subscription found for Stripe subscription ${subscriptionId}`,
      );
      return;
    }

    const now = new Date();

    if (localSubscription.status === 'ACTIVE') {
      this.logger.warn(
        `Subscription ${localSubscription.id} already active (Stripe subscription ${subscriptionId})`,
      );
      return;
    }

    let monthsToAdd = 0;
    let planEndedAt = localSubscription.planEndedAt;
    if (localSubscription.plan.billingPeriod === 'MONTHLY') {
      monthsToAdd = 1;
    } else if (localSubscription.plan.billingPeriod === 'BIANNUAL') {
      monthsToAdd = 6;
    } else if (localSubscription.plan.billingPeriod === 'YEARLY') {
      monthsToAdd = 12;
    }

    if (monthsToAdd) {
      planEndedAt = new Date(
        localSubscription.planEndedAt.getTime() +
          monthsToAdd * 1000 * 60 * 60 * 24 * 30,
      );
    }

    // Run updates in transaction
    await this.prisma.$transaction([
      this.prisma.userSubscription.update({
        where: { id: localSubscription.id },
        data: {
          status: 'ACTIVE',
          paidAt: now,
          planStartedAt: now,
          planEndedAt,
          stripeSubscriptionId: subscriptionId,
        },
      }),

      this.prisma.user.update({
        where: { id: userId },
        data: {
          memberShip: 'VIP',
          trialEndsAt: null,
        },
      }),

      this.prisma.invoice.create({
        data: {
          stripeInvoiceId: invoice.id,
          invoiceNumber: invoice.number as string,
          userSubscriptionId: localSubscription.id,
          amountCents: invoice.total as number,
          paidCents: invoice.total as number,
          status: 'PAID',
          periodStart: new Date(invoice.period_start * 1000),
          periodEnd: new Date(invoice.period_end * 1000),
        },
      }),
    ]);

    this.logger.log(
      `Subscription ${localSubscription.id} activated via invoice ${invoice.id} (Stripe subscription ${subscriptionId})`,
    );
  }
}
