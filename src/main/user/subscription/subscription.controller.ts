import { GetUser, Public, ValidateAuth } from '@/common/jwt/jwt.decorator';
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateIntentService } from './services/create-intent.service';
import { HandleWebhookService } from './services/handle-webhook.service';
import { SubscriptionService } from './services/subscription.service';

@ApiTags('User -- Subscription')
@ApiBearerAuth()
@ValidateAuth()
@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly createIntentService: CreateIntentService,
    private readonly handleWebhookService: HandleWebhookService,
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

  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @Public()
  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Body() body: Buffer, // raw body for Stripe verification
  ) {
    try {
      await this.handleWebhookService.handleWebhook(signature, body);
      return { received: true };
    } catch (error) {
      return { received: false, error: error.message };
    }
  }
}
