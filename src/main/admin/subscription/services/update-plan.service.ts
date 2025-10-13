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

    // Step 3: Handle price & discount changes
    let stripePriceId = existingPlan.stripePriceId;
    let priceWithoutDiscount = existingPlan.priceWithoutDiscount;
    let price = existingPlan.price;

    const priceChanged =
      dto.price !== undefined ||
      dto.discountPercent !== undefined ||
      dto.billingPeriod !== undefined;

    if (priceChanged) {
      // Compute new prices (in USD dollars for Stripe service)
      const newPriceWithoutDiscount =
        dto.price !== undefined
          ? dto.price
          : existingPlan.priceWithoutDiscount / 100;
      const discountPercent =
        dto.discountPercent ?? existingPlan.discountPercent;
      const finalPrice = Number(
        (newPriceWithoutDiscount * (1 - discountPercent / 100)).toFixed(2),
      );

      // Determine billing interval
      const interval =
        (dto.billingPeriod ?? existingPlan.billingPeriod) === 'MONTHLY'
          ? 'month'
          : 'year';

      // Step 3a: Create new Stripe price
      const newStripePrice = await this.stripeService.updatePrice({
        productId: existingPlan.stripeProductId,
        newPrice: finalPrice,
        currency: existingPlan.currency,
        interval,
      });

      stripePriceId = newStripePrice.id;
      priceWithoutDiscount = newPriceWithoutDiscount;
      price = finalPrice;

      updatedData.stripePriceId = stripePriceId;
      updatedData.price = price;
      updatedData.priceWithoutDiscount = priceWithoutDiscount;

      this.logger.log(
        `Stripe price updated: oldPriceId=${existingPlan.stripePriceId}, newPriceId=${stripePriceId}`,
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
