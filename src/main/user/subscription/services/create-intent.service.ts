import { AppError } from '@/common/error/handle-error.app';
import { HandleError } from '@/common/error/handle-error.decorator';
import { successResponse, TResponse } from '@/common/utils/response.util';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { StripeService } from '@/lib/stripe/stripe.service';
import { StripePaymentMetadata } from '@/lib/stripe/stripe.types';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class CreateIntentService {
  private readonly logger = new Logger(CreateIntentService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * Create a one-time payment intent for a given user and plan.
   * No redirect or checkout session — returns clientSecret for direct app payment.
   */
  @HandleError('Failed to create payment intent', 'Subscription')
  async createPaymentIntent(
    userId: string,
    planId: string,
  ): Promise<TResponse<any>> {
    // 0. Normalize current time
    const now = new Date();

    // 1. Get user
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { id: userId },
    });

    // 2. Prevent creating intent if user already has an active subscription
    //    Active means status === 'ACTIVE' and ends in the future
    const activeSub = await this.prismaService.userSubscription.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        planEndedAt: { gt: now },
      },
    });
    if (activeSub) {
      // Optionally include plan info in error message
      throw new AppError(
        400,
        `User already has an active subscription until ${activeSub.planEndedAt.toISOString()}`,
      );
    }

    // 3. Get plan (must be active)
    const plan = await this.prismaService.subscriptionPlan.findUniqueOrThrow({
      where: { id: planId, isActive: true },
    });

    // 4. Prevent duplicate pending/incomplete intents
    //    If user already has a pending/incomplete payment intent for same plan,
    //    return that intent's client_secret if possible (so caller can reuse).
    const existingPending = await this.prismaService.userSubscription.findFirst(
      {
        where: {
          userId: user.id,
          planId: plan.id,
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      },
    );

    if (existingPending) {
      this.logger.log(
        `User ${user.id} already has a pending payment (${existingPending.stripeTransactionId}).`,
      );

      // Try to fetch the PaymentIntent to return client_secret (optional)
      try {
        const existingIntent = await this.stripeService.retrievePaymentIntent(
          existingPending.stripeTransactionId,
        );

        // If client_secret still available, return it instead of creating a new one
        if (existingIntent?.client_secret) {
          return successResponse(
            {
              paymentIntentId: existingIntent.id,
              clientSecret: existingIntent.client_secret,
              amount: plan.priceCents,
              currency: plan.currency,
              planTitle: plan.title,
              message:
                'A pending payment already exists for this plan. Use the returned clientSecret to complete it.',
            },
            'Pending payment found',
          );
        }
      } catch (err) {
        // retrieving failed: fall through and create a new intent
        this.logger.warn(
          `Failed to retrieve existing PaymentIntent ${existingPending.stripeTransactionId}: ${err?.message}`,
        );
      }
    }

    // 5. Ensure Stripe Customer exists
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripeService.createCustomer({
        email: user.email,
        name: user.name || user.username,
        metadata: {
          userId: user.id,
          email: user.email,
          name: user.name || user.username,
        },
      });

      await this.prismaService.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      });

      customerId = customer.id;
    }

    // 6. Create metadata and payment intent
    const metadata: StripePaymentMetadata = {
      userId: user.id,
      email: user.email,
      planId: plan.id,
      planTitle: plan.title,
      stripeProductId: plan.stripeProductId,
      stripePriceId: plan.stripePriceId,
    };

    const paymentIntent = await this.stripeService.createPaymentIntent({
      amount: plan.priceCents,
      currency: plan.currency,
      customerId,
      metadata,
    });

    // 7. Calculate plan period based on billingPeriod (start now, end in 1 month or 1 year)
    const planStartedAt = new Date();
    const planEndedAt = new Date(planStartedAt);
    if (plan.billingPeriod === 'MONTHLY') {
      planEndedAt.setMonth(planEndedAt.getMonth() + 1);
    } else if (plan.billingPeriod === 'YEARLY') {
      planEndedAt.setFullYear(planEndedAt.getFullYear() + 1);
    }

    // 8. Record in DB with initial status = INCOMPLETE (waiting for webhook confirmation)
    await this.prismaService.userSubscription.create({
      data: {
        user: { connect: { id: user.id } },
        plan: { connect: { id: plan.id } },
        planStartedAt,
        planEndedAt,
        stripeTransactionId: paymentIntent.id,
        status: 'PENDING',
      },
    });

    this.logger.log(
      `Created one-time payment intent ${paymentIntent.id} for user ${user.email}`,
    );

    // 9. Return client_secret to complete payment in app
    return successResponse(
      {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: plan.priceCents,
        currency: plan.currency,
        planTitle: plan.title,
      },
      'Created one-time payment intent',
    );
  }

  /**
   * @param userId
   * @returns PaymentIntent
   */
  @HandleError('Failed to create renew payment intent', 'Subscription')
  async createRenewPaymentIntent(userId: string) {
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
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'No completed subscription found.',
      );
    }

    // check if plan is still active
    if (!userSubscription.plan.isActive) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'This plan is no longer active.',
      );
    }

    return this.createPaymentIntent(userId, userSubscription.plan.id);
  }
}
