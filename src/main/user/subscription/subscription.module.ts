import { Module } from '@nestjs/common';
import { CreateIntentService } from './services/create-intent.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './services/subscription.service';

@Module({
  controllers: [SubscriptionController],
  providers: [CreateIntentService, SubscriptionService],
})
export class SubscriptionModule {}
