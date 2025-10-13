import { GetUser, ValidateAuth } from '@/common/jwt/jwt.decorator';
import { Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscriptionService } from './services/subscription.service';

@ApiTags('User -- Subscription')
@ApiBearerAuth()
@ValidateAuth()
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @ApiOperation({ summary: 'Create payment intent' })
  @Post(':planId')
  async createPaymentIntent(
    @GetUser('sub') userId: string,
    @Param('planId') planId: string,
  ) {
    return this.subscriptionService.createPaymentIntent(userId, planId);
  }
}
