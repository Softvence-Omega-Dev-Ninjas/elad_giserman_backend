import { Module } from '@nestjs/common';
import { SubscriptionModule } from './subscription/subscription.module';
import { AdminOfferService } from './service/admin-offer.service';
import { AdminController } from './controller/admin.controller';
import { AdminReviewController } from './controller/admin.review.controller';
import { AdminReviewService } from './service/admin-review.service';

@Module({
  imports: [SubscriptionModule],
  providers: [AdminOfferService,AdminReviewService],
  controllers: [AdminController,AdminReviewController],
})
export class AdminModule {}
