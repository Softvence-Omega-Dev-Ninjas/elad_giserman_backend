import { GetUser, Public, ValidateAuth } from '@/common/jwt/jwt.decorator';
import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateIntentService } from './services/create-intent.service';
import { SubscriptionService } from './services/subscription.service';

@ApiTags('User -- Subscription')
@ApiBearerAuth()
@ValidateAuth()
@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly createIntentService: CreateIntentService,
  ) {}

  @ApiOperation({ summary: 'Get plans for user' })
  @Get()
  async getPlansForUser() {
    return this.subscriptionService.getPlansForUser();
  }

  @ApiOperation({ summary: 'Create payment intent' })
  @Post(':planId')
  async createPaymentIntent(
    @GetUser('sub') userId: string,
    @Param('planId') planId: string,
  ) {
    return this.createIntentService.createPaymentIntent(userId, planId);
  }

  @ApiOperation({ summary: 'Handle webhook' })
  @Public()
  @Post('webhook/stripe')
  async handleWebhook() {
    return 'Testing webhook';
  }
}
