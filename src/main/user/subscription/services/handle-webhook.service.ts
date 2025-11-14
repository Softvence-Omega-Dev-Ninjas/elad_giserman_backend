import { AppError } from '@/common/error/handle-error.app';
import { HandleError } from '@/common/error/handle-error.decorator';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { StripeService } from '@/lib/stripe/stripe.service';
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

      default:
        this.logger.log(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  private async handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
    const setupIntentId = setupIntent.id;
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

    const paymentMethodId =
      typeof setupIntent.payment_method === 'string'
        ? setupIntent.payment_method
        : ((setupIntent.payment_method as any)?.id ?? null);

    try {
      await this.prisma.$transaction([
        this.prisma.userSubscription.update({
          where: { id: subscription.id },
          data: { status: 'ACTIVE', paidAt: new Date() },
        }),
        this.prisma.user.update({
          where: { id: subscription.userId },
          data: {
            subscriptionStatus: 'ACTIVE',
            currentPlan: {
              connect: {
                id: subscription.planId,
              },
            },
            stripeDefaultPaymentMethodId: paymentMethodId,
            memberShip: 'VIP',
            trialEndsAt: null,
          },
        }),
      ]);

      this.logger.log(
        `SetupIntent succeeded and subscription ${subscription.id} activated (setupIntent: ${setupIntentId})`,
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
}
