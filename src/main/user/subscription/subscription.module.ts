import { Module } from '@nestjs/common';
import { CreateIntentService } from './services/create-intent.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './services/subscription.service';
import { HandleWebhookService } from './services/handle-webhook.service';

@Module({
  controllers: [SubscriptionController],
  providers: [CreateIntentService, SubscriptionService, HandleWebhookService],
})
export class SubscriptionModule {}
