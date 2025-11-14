import { Module } from '@nestjs/common';
import { CreateIntentService } from './services/create-intent.service';
import { HandleWebhookService } from './services/handle-webhook.service';
import { SubscriptionService } from './services/subscription.service';
import { SubscriptionController } from './subscription.controller';

@Module({
  controllers: [SubscriptionController],
  providers: [CreateIntentService, SubscriptionService, HandleWebhookService],
})
export class SubscriptionModule {}
