import { HandleError } from '@/common/error/handle-error.decorator';
import { successResponse, TResponse } from '@/common/utils/response.util';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { StripeService } from '@/lib/stripe/stripe.service';
import { StripePaymentMetadata } from '@/lib/stripe/stripe.types';
import { Injectable, Logger } from '@nestjs/common';

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
    // 1. Get user
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { id: userId },
    });

    // 2. Get plan (must be active)
    const plan = await this.prismaService.subscriptionPlan.findUniqueOrThrow({
      where: { id: planId, isActive: true },
    });

    // 3. Ensure Stripe Customer exists
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

    // 4. Create a one-time payment intent (for card payments)
    const metadata: StripePaymentMetadata = {
      userId: user.id,
      planId: plan.id,
      planTitle: plan.title,
      stripeProductId: plan.stripeProductId,
      stripePriceId: plan.stripePriceId,
    };
    const paymentIntent = await this.stripeService.createPaymentIntent({
      amount: Math.round(plan.price * 100), // convert USD → cents
      currency: plan.currency,
      customerId,
      metadata,
    });

    // 5. Calculate plan period based on billingPeriod
    const planStartedAt = new Date();
    const planEndedAt = new Date(planStartedAt);
    if (plan.billingPeriod === 'MONTHLY') {
      planEndedAt.setMonth(planEndedAt.getMonth() + 1);
    } else if (plan.billingPeriod === 'YEARLY') {
      planEndedAt.setFullYear(planEndedAt.getFullYear() + 1);
    }

    // 6. Record in DB
    await this.prismaService.userSubscription.create({
      data: {
        user: { connect: { id: user.id } },
        plan: { connect: { id: plan.id } },
        planStartedAt,
        planEndedAt,
        stripeTransactionId: paymentIntent.id,
      },
    });

    this.logger.log(
      `Created one-time payment intent ${paymentIntent.id} for user ${user.email}`,
    );

    // Return client_secret to complete payment in app
    return successResponse(
      {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: plan.price,
        currency: plan.currency,
        planTitle: plan.title,
      },
      'Created one-time payment intent',
    );
  }
}
