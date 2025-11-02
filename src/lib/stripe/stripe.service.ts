import { ENVEnum } from '@/common/enum/env.enum';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripePaymentMetadata } from './stripe.types';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.getOrThrow<string>(
      ENVEnum.STRIPE_SECRET_KEY,
    );
    this.stripe = new Stripe(secretKey);
  }

  // Product & Price Management
  async createProductWithPrice({
    title,
    description,
    priceCents,
    currency = 'usd',
    interval = 'month',
    intervalCount = 1,
  }: {
    title: string;
    description?: string;
    interval?: 'month' | 'year';
    intervalCount?: number;
    priceCents: number;
    currency?: string;
  }) {
    const product = await this.stripe.products.create({
      name: title,
      description,
    });

    const stripePrice = await this.stripe.prices.create({
      product: product.id,
      unit_amount: priceCents,
      currency,
      recurring: {
        interval,
        interval_count: intervalCount,
      },
    });

    this.logger.log(
      `Created Stripe product ${product.id} with price ${stripePrice.id}`,
    );

    return { product, stripePrice };
  }

  async updatePrice({
    productId,
    newPriceCents,
    currency = 'usd',
    interval = 'month',
    intervalCount = 1,
  }: {
    productId: string;
    newPriceCents: number;
    intervalCount?: number;
    interval?: 'month' | 'year';
    currency?: string;
  }) {
    const stripePrice = await this.stripe.prices.create({
      product: productId,
      unit_amount: newPriceCents,
      currency,
      recurring: {
        interval,
        interval_count: intervalCount,
      },
    });

    this.logger.log(
      `Created new price ${stripePrice.id} for product ${productId}`,
    );

    return stripePrice;
  }

  async deleteProduct(productId: string) {
    // Step 1: Mark the product inactive
    const deletedProduct = await this.stripe.products.update(productId, {
      active: false,
    });
    this.logger.log(`Product ${productId} marked inactive`);

    // Step 2: Fetch all related prices
    const prices = await this.stripe.prices.list({
      product: productId,
      active: true,
    });

    // Step 3: Deactivate all associated prices
    for (const price of prices.data) {
      await this.stripe.prices.update(price.id, { active: false });
      this.logger.log(`Price ${price.id} marked inactive`);
    }

    return deletedProduct;
  }

  // Payment Intent Management
  async retrievePaymentIntent(paymentIntentId: string) {
    const pi = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    this.logger.log(`Retrieved PaymentIntent ${paymentIntentId}`);
    return pi;
  }

  async createPaymentIntent({
    amount,
    currency,
    customerId,
    metadata,
  }: {
    amount: number;
    currency: string;
    customerId: string;
    metadata: StripePaymentMetadata;
  }) {
    const intent = await this.stripe.paymentIntents.create(
      {
        amount,
        currency,
        customer: customerId,
        receipt_email: metadata.email,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata,
      },
      {
        idempotencyKey: `pi_${metadata.userId}_${metadata.planId}`,
      },
    );

    this.logger.log(`Created payment intent ${intent.id}`);
    return intent;
  }

  // Checkout session Management
  async createCheckoutSession({
    userId,
    priceId,
    successUrl,
    cancelUrl,
    metadata,
  }: {
    userId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata: StripePaymentMetadata;
  }) {
    const customer = await this.getOrCreateCustomerId(
      userId,
      metadata.email,
      metadata.name,
    );

    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer: customer.id,
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    this.logger.log(
      `Created checkout session ${session.id} for user ${userId}`,
    );
    return session;
  }

  // Customer Management
  async getOrCreateCustomerId(userId: string, email: string, name: string) {
    // Step 1: Check if the user already has a Stripe customer linked
    const existingCustomer = await this.stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomer.data.length > 0) {
      const customer = existingCustomer.data[0];
      this.logger.log(
        `Found existing Stripe customer ${customer.id} for user ${userId}`,
      );
      return customer;
    }

    // Step 2: Create a new Stripe customer
    const newCustomer = await this.stripe.customers.create({
      email,
      name,
      metadata: { userId, email, name },
    });

    this.logger.log(
      `Created new Stripe customer ${newCustomer.id} for user ${userId}`,
    );
    return newCustomer;
  }

  async retrieveCustomer(customerId: string) {
    const customer = await this.stripe.customers.retrieve(customerId);
    this.logger.log(`Retrieved customer ${customerId}`);
    return customer;
  }

  // Subscription Management & Cancellation Utilities
  async createSubscription({
    customerId,
    priceId,
    metadata,
    trialPeriodDays,
    expand = ['latest_invoice.payment_intent'],
    offSession = true,
    paymentBehavior = 'default_incomplete',
  }: {
    customerId: string;
    priceId: string;
    metadata?: Record<string, string>;
    trialPeriodDays?: number;
    expand?: string[];
    offSession?: boolean;
    paymentBehavior?:
      | 'allow_incomplete'
      | 'default_incomplete'
      | 'error_if_incomplete';
  }) {
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata,
      trial_period_days: trialPeriodDays,
      expand,
      payment_behavior: paymentBehavior,
      collection_method: offSession ? 'charge_automatically' : 'send_invoice',
    });

    this.logger.log(
      `Created subscription ${subscription.id} for customer ${customerId}`,
    );

    return subscription;
  }

  async retrieveSubscription(subscriptionId: string) {
    const sub = await this.stripe.subscriptions.retrieve(subscriptionId);
    this.logger.log(`Retrieved subscription ${subscriptionId}`);
    return sub;
  }

  async listCustomerSubscriptions(customerId: string) {
    const subs = await this.stripe.subscriptions.list({
      customer: customerId,
      limit: 100,
    });
    this.logger.log(`Listed subscriptions for customer ${customerId}`);
    return subs;
  }

  async cancelSubscription({
    subscriptionId,
    atPeriodEnd = true,
    invoiceNow = false,
  }: {
    subscriptionId: string;
    atPeriodEnd?: boolean;
    invoiceNow?: boolean;
  }) {
    if (atPeriodEnd) {
      const updated = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      this.logger.log(
        `Subscription ${subscriptionId} scheduled to cancel at period end`,
      );

      if (invoiceNow) {
        // create an invoice for any pending prorations or upcoming items
        await this.stripe.invoices.create({
          customer: updated.customer as string,
        });
      }

      return updated;
    }

    // immediate cancellation
    const deleted = await this.stripe.subscriptions.cancel(subscriptionId);
    this.logger.log(`Subscription ${subscriptionId} cancelled immediately`);
    return deleted;
  }

  async scheduleSubscriptionCancel(
    subscriptionId: string,
    cancelAtUnixSeconds: number,
  ) {
    const updated = await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at: cancelAtUnixSeconds,
    });
    this.logger.log(
      `Subscription ${subscriptionId} scheduled to cancel at ${cancelAtUnixSeconds}`,
    );
    return updated;
  }

  async resumeSubscription(subscriptionId: string) {
    const updated = await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
      cancel_at: null,
    } as any);

    this.logger.log(`Subscription ${subscriptionId} resumed`);
    return updated;
  }

  // Stripe Webhook Utilities
  constructWebhookEvent(rawBody: Buffer, signature: string) {
    const endpointSecret = this.configService.getOrThrow<string>(
      ENVEnum.STRIPE_WEBHOOK_SECRET,
    );
    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        endpointSecret,
      );
    } catch (err) {
      this.logger.error('Invalid webhook signature', err);
      throw new Error('Invalid webhook signature');
    }
  }
}
