import { Module } from '@nestjs/common';
import { SubscriptionModule } from './subscription/subscription.module';
import { AdminOfferService } from './service/admin-offer.service';
import { AdminController } from './controller/admin.controller';
import { AdminReviewController } from './controller/admin.review.controller';
import { AdminReviewService } from './service/admin-review.service';

import { AdminPlatfromManagementService } from './service/admin.platfromManagement.service';
import { AdminPlatformManagementController } from './controller/admin.patformManagement.controller';

@Module({
  imports: [SubscriptionModule],
  providers: [AdminOfferService,AdminReviewService,AdminPlatfromManagementService],
  controllers: [AdminController,AdminReviewController,AdminPlatformManagementController],
})
export class AdminModule {}
