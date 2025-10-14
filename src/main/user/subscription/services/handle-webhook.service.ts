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
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      default:
        this.logger.log(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    const transactionId = paymentIntent.id;

    const subscription = await this.prisma.userSubscription.findUnique({
      where: { stripeTransactionId: transactionId },
    });

    if (!subscription) {
      this.logger.error(
        `Subscription not found for paymentIntent ${transactionId}`,
      );
      return;
    }

    // Idempotent check
    if (subscription.status === 'ACTIVE') return;

    try {
      await this.prisma.userSubscription.update({
        where: { id: subscription.id },
        data: { status: 'ACTIVE', paidAt: new Date() },
      });
      this.logger.log(`Payment succeeded for subscription ${subscription.id}`);
    } catch (err) {
      this.logger.error(
        `Failed to update subscription ${subscription.id}`,
        err,
      );
      throw err;
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const transactionId = paymentIntent.id;

    const subscription = await this.prisma.userSubscription.findUnique({
      where: { stripeTransactionId: transactionId },
    });

    if (!subscription) {
      this.logger.error(
        `Subscription not found for failed paymentIntent ${transactionId}`,
      );
      return;
    }

    try {
      await this.prisma.userSubscription.update({
        where: { id: subscription.id },
        data: { status: 'FAILED', failedAt: new Date() },
      });
      this.logger.warn(`Payment failed for subscription ${subscription.id}`);
    } catch (err) {
      this.logger.error(
        `Failed to update failed subscription ${subscription.id}`,
        err,
      );
      throw err;
    }
  }
}
