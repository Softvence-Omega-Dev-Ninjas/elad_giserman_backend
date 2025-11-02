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

    // Step 2: Prepare updated data for DB
    const updatedData: Prisma.SubscriptionPlanUpdateInput = {
      title: dto.title ?? existingPlan.title,
      description: dto.description ?? existingPlan.description,
      benefits: dto.benefits ?? existingPlan.benefits,
      isPopular: dto.isPopular ?? existingPlan.isPopular,
      billingPeriod: dto.billingPeriod ?? existingPlan.billingPeriod,
      discountPercent: dto.discountPercent ?? existingPlan.discountPercent,
    };

    // Step 3: Determine if price actually changed
    const newPriceWithoutDiscount =
      dto.price !== undefined
        ? dto.price
        : existingPlan.priceWithoutDiscountCents;
    const newDiscountPercent =
      dto.discountPercent !== undefined
        ? dto.discountPercent
        : existingPlan.discountPercent;
    const newBillingPeriod = dto.billingPeriod ?? existingPlan.billingPeriod;

    const finalPrice = Number(
      (newPriceWithoutDiscount * (1 - newDiscountPercent / 100)).toFixed(2),
    );

    const priceChanged =
      finalPrice !== existingPlan.priceCents ||
      newPriceWithoutDiscount !== existingPlan.priceWithoutDiscountCents ||
      newBillingPeriod !== existingPlan.billingPeriod;

    if (priceChanged) {
      // Step 3a: Determine billing interval for Stripe
      const interval = newBillingPeriod === 'MONTHLY' ? 'month' : 'year';

      // Step 3b: Create new Stripe price
      const newStripePrice = await this.stripeService.updatePrice({
        productId: existingPlan.stripeProductId,
        newPrice: finalPrice,
        currency: existingPlan.currency,
        interval,
      });

      // Step 3c: Update DB payload
      updatedData.stripePriceId = newStripePrice.id;
      updatedData.priceWithoutDiscountCents = newPriceWithoutDiscount;
      updatedData.priceCents = finalPrice;

      this.logger.log(
        `Stripe price updated: oldPriceId=${existingPlan.stripePriceId}, newPriceId=${newStripePrice.id}`,
      );
    }

    // Step 4: Update DB
    const updatedPlan = await this.prismaService.subscriptionPlan.update({
      where: { id: planId },
      data: updatedData,
    });

    this.logger.log(`Subscription plan ${planId} updated successfully`);

    return successResponse(updatedPlan, 'Plan updated successfully');
  }
}
