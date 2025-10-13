import { GetUser, ValidateAuth } from '@/common/jwt/jwt.decorator';
import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateIntentService } from './services/create-intent.service';

@ApiTags('User -- Subscription')
@ApiBearerAuth()
@ValidateAuth()
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly createIntentService: CreateIntentService) {}

  @ApiOperation({ summary: 'Get plans for user' })
  @Get()
  async getPlansForUser() {}

  @ApiOperation({ summary: 'Create payment intent' })
  @Post(':planId')
  async createPaymentIntent(
    @GetUser('sub') userId: string,
    @Param('planId') planId: string,
  ) {
    return this.createIntentService.createPaymentIntent(userId, planId);
  }
}
