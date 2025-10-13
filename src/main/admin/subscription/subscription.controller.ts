import { ValidateAdmin } from '@/common/jwt/jwt.decorator';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSubscriptionPlanDto } from './dto/create-plan.dto';
import { GetAllPlansDto } from './dto/plan.dto';
import { SubscriptionService } from './services/subscription.service';

@ApiTags('Admin -- Subscription')
@ApiBearerAuth()
@ValidateAdmin()
@Controller('admin/subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @ApiOperation({ summary: 'Create a new plan' })
  @Post('plan')
  async createNewPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionService.createNewPlan(dto);
  }

  @ApiOperation({ summary: 'Get all plans' })
  @Get('plans')
  async getPlans(@Query() query: GetAllPlansDto) {
    return this.subscriptionService.getPlans(query);
  }
}
