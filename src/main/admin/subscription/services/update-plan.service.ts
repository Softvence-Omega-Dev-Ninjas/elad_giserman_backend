import { HandleError } from '@/common/error/handle-error.decorator';
import { successResponse, TResponse } from '@/common/utils/response.util';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { StripeService } from '@/lib/stripe/stripe.service';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UpdateSubscriptionPlanDto } from '../dto/create-plan.dto';

@Injectable()
export class UpdatePlanService {
  private readonly logger = new Logger(UpdatePlanService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  @HandleError('Failed to update plan', 'Plan')
  async updatePlan(
    planId: string,
    dto: UpdateSubscriptionPlanDto,
  ): Promise<TResponse<any>> {
    // Step 1: Fetch existing plan
    const existingPlan =
      await this.prismaService.subscriptionPlan.findUniqueOrThrow({
        where: { id: planId },
      });

    // Step 2: Prepare default updates
    const updatedData: Prisma.SubscriptionPlanUpdateInput = {
      title: dto.title ?? existingPlan.title,
      description: dto.description ?? existingPlan.description,
      benefits: dto.benefits ?? existingPlan.benefits,
      isPopular: dto.isPopular ?? existingPlan.isPopular,
      billingPeriod: dto.billingPeriod ?? existingPlan.billingPeriod,
      discountPercent: dto.discountPercent ?? existingPlan.discountPercent,
    };

    // Step 3: Calculate new prices
    const newPriceWithoutDiscountDollars =
      dto.price ?? existingPlan.priceWithoutDiscountCents / 100;
    const newDiscountPercent =
      dto.discountPercent ?? existingPlan.discountPercent;

    const newBillingPeriod = dto.billingPeriod ?? existingPlan.billingPeriod;

    // Convert to cents for Stripe
    const priceWithoutDiscountCents = Math.round(
      newPriceWithoutDiscountDollars * 100,
    );
    const finalPriceCents = Math.round(
      newPriceWithoutDiscountDollars * (1 - newDiscountPercent / 100) * 100,
    );

    const priceChanged =
      finalPriceCents !== existingPlan.priceCents ||
      priceWithoutDiscountCents !== existingPlan.priceWithoutDiscountCents ||
      newBillingPeriod !== existingPlan.billingPeriod;

    // Step 4: Update Stripe price if changed
    if (priceChanged) {
      // Determine interval type and count
      let interval: 'month' | 'year' = 'month';
      let intervalCount = 1;

      if (newBillingPeriod === 'MONTHLY') {
        interval = 'month';
        intervalCount = 1;
      } else if (newBillingPeriod === 'BIANNUAL') {
        interval = 'month';
        intervalCount = 6;
      } else if (newBillingPeriod === 'YEARLY') {
        interval = 'year';
        intervalCount = 1;
      }

      const newStripePrice = await this.stripeService.updatePrice({
        productId: existingPlan.stripeProductId,
        newPriceCents: finalPriceCents,
        currency: existingPlan.currency,
        interval,
        intervalCount,
      });

      updatedData.stripePriceId = newStripePrice.id;
      updatedData.priceCents = finalPriceCents;
      updatedData.priceWithoutDiscountCents = priceWithoutDiscountCents;

      this.logger.log(
        `Stripe price updated for plan ${planId}: old=${existingPlan.stripePriceId}, new=${newStripePrice.id}`,
      );
    }

    // Step 5: Update DB
    const updatedPlan = await this.prismaService.subscriptionPlan.update({
      where: { id: planId },
      data: updatedData,
    });

    this.logger.log(`Subscription plan ${planId} updated successfully`);
    return successResponse(updatedPlan, 'Plan updated successfully');
  }
}
