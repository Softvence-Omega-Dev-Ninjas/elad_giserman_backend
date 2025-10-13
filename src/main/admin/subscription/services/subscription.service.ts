import { HandleError } from '@/common/error/handle-error.decorator';
import { successResponse, TResponse } from '@/common/utils/response.util';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { StripeService } from '@/lib/stripe/stripe.service';
import { Injectable, Logger } from '@nestjs/common';
import { CreateSubscriptionPlanDto } from '../dto/create-plan.dto';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  @HandleError('Failed to create plan', 'Stripe Plan')
  async createNewPlan(dto: CreateSubscriptionPlanDto): Promise<TResponse<any>> {
    // 1. Compute discounted and non-discounted amounts
    const priceWithoutDiscount = dto.price;
    const discountPercent = dto.discountPercent ?? 0;
    const finalPrice = (
      priceWithoutDiscount *
      (1 - discountPercent / 100)
    ).toFixed(2);
    const price = Number(finalPrice); // * Amount that will be paid by customer

    this.logger.log(`Final price: ${price}`);

    // 2. Create Product & Price in Stripe
    const { product, stripePrice } =
      await this.stripeService.createProductWithPrice({
        title: dto.title,
        description: dto.description?.trim() ?? dto.benefits.join('\n'),
        price,
        interval: dto.billingPeriod === 'MONTHLY' ? 'month' : 'year',
      });

    // 3. Create Plan in Database
    const plan = await this.prismaService.subscriptionPlan.create({
      data: {
        title: dto.title,
        description: dto.description,
        benefits: dto.benefits,
        isPopular: dto.isPopular ?? false,
        stripeProductId: product.id,
        stripePriceId: stripePrice.id,
        billingPeriod: dto.billingPeriod,
        price,
        discountPercent,
        priceWithoutDiscount,
        currency: stripePrice.currency,
        isActive: true,
      },
    });

    this.logger.log(`Created new subscription plan: ${plan.title}`);

    return successResponse(plan, 'Plan created successfully');
  }
}
