import { Module } from '@nestjs/common';
import { SubscriptionModule } from './subscription/subscription.module';
import { AdminOfferService } from './service/admin-offer.service';
import { AdminController } from './controller/admin.controller';

@Module({
  imports: [SubscriptionModule],
  providers: [AdminOfferService],
  controllers: [AdminController],
})
export class AdminModule {}
