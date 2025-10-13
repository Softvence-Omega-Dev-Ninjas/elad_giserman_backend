import { Module } from '@nestjs/common';
import { CreateIntentService } from './services/create-intent.service';
import { SubscriptionController } from './subscription.controller';

@Module({
  controllers: [SubscriptionController],
  providers: [CreateIntentService],
})
export class SubscriptionModule {}
