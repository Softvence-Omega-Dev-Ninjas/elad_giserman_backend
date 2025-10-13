import { successResponse, TResponse } from '@/common/utils/response.util';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { StripeService } from '@/lib/stripe/stripe.service';
import { Injectable, Logger } from '@nestjs/common';
import { UpdateSubscriptionPlanDto } from '../dto/create-plan.dto';

@Injectable()
export class UpdatePlanService {
  private readonly logger = new Logger(UpdatePlanService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  async updatePlan(
    planId: string,
    dto: UpdateSubscriptionPlanDto,
  ): Promise<TResponse<any>> {
    this.logger.log(
      `Updating plan: ${planId}, with data: ${JSON.stringify(dto)}`,
    );
    return successResponse(null, 'Plan updated successfully');
  }
}
