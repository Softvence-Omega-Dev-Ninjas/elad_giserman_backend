import { HandleError } from '@/common/error/handle-error.decorator';
import { successResponse, TResponse } from '@/common/utils/response.util';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { StripeService } from '@/lib/stripe/stripe.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CreateSessionService {
  private readonly logger = new Logger(CreateSessionService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  @HandleError('Failed to create checkout session', 'Check out session')
  async createCheckOutSession(userId: string): Promise<TResponse<any>> {
    this.logger.log(`Creating checkout session for user ${userId}`);

    return successResponse({});
  }

  @HandleError('Failed to cancel subscription', 'Cancel subscription')
  async cancelSubscription(userId: string): Promise<TResponse<any>> {
    this.logger.log(`Canceling subscription for user ${userId}`);

    return successResponse({});
  }
}
