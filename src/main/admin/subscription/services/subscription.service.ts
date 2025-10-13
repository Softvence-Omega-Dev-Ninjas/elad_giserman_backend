import { HandleError } from '@/common/error/handle-error.decorator';
import {
  successPaginatedResponse,
  successResponse,
  TPaginatedResponse,
  TResponse,
} from '@/common/utils/response.util';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { StripeService } from '@/lib/stripe/stripe.service';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateSubscriptionPlanDto } from '../dto/create-plan.dto';
import { GetAllPlansDto } from '../dto/plan.dto';

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

  @HandleError('Failed to fetch plans', 'Plans')
  async getPlans(query: GetAllPlansDto): Promise<TPaginatedResponse<any>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const search = query.search?.trim() ?? '';

    const where: Prisma.SubscriptionPlanWhereInput = {
      isActive: true,
    };

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [plans, total] = await this.prismaService.$transaction([
      this.prismaService.subscriptionPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaService.subscriptionPlan.count({
        where,
      }),
    ]);

    return successPaginatedResponse(
      plans,
      {
        page,
        limit,
        total,
      },
      'Plans fetched successfully',
    );
  }

  @HandleError('Failed to fetch plan', 'Plan')
  async getASinglePlan(planId: string): Promise<TResponse<any>> {
    const plan = await this.prismaService.subscriptionPlan.findUniqueOrThrow({
      where: { id: planId, isActive: true }, // Only if it is active
      include: {
        userSubscription: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return successResponse(plan, 'Plan fetched successfully');
  }

  @HandleError('Failed to delete plan', 'Plan')
  async deletePlan(planId: string): Promise<TResponse<any>> {
    const existingPlan =
      await this.prismaService.subscriptionPlan.findUniqueOrThrow({
        where: { id: planId },
      });

    // Archive the product and all its prices in Stripe
    await this.stripeService.deleteProduct(existingPlan.stripeProductId);

    // Mark plan as inactive in DB
    await this.prismaService.subscriptionPlan.update({
      where: { id: planId },
      data: { isActive: false },
    });

    return successResponse(null, 'Plan deleted successfully');
  }
}
