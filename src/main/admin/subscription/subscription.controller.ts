import { ValidateAdmin } from '@/common/jwt/jwt.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateSubscriptionPlanDto } from './dto/create-plan.dto';
import { SubscriptionService } from './services/subscription.service';

@ApiTags('Admin -- Subscription')
@ApiBearerAuth()
@ValidateAdmin()
@Controller('admin/subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('plan')
  async createNewPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionService.createNewPlan(dto);
  }
}
