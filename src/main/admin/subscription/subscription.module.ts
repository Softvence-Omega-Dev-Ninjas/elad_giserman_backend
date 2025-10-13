import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './services/subscription.service';
import { UpdatePlanService } from './services/update-plan.service';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, UpdatePlanService],
})
export class SubscriptionModule {}
