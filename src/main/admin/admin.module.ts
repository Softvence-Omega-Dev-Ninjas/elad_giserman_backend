import { Module } from '@nestjs/common';
import { SubscriptionModule } from './subscription/subscription.module';
import { AdminOfferService } from './service/admin-offer.service';
import { AdminController } from './controller/admin.controller';
import { AdminReviewController } from './controller/admin.review.controller';
import { AdminReviewService } from './service/admin-review.service';

import { AdminPlatfromManagementService } from './service/admin.platfromManagement.service';
import { AdminPlatformManagementController } from './controller/admin.patformManagement.controller';
import { CategoryContoller } from './controller/admin.category.controller';
import { CategoryService } from './service/admin.category.service';

@Module({
  imports: [SubscriptionModule],
  providers: [
    AdminOfferService,
    AdminReviewService,
    AdminPlatfromManagementService,
    CategoryService,
  ],
  controllers: [
    AdminController,
    AdminReviewController,
    AdminPlatformManagementController,
    CategoryContoller,
  ],
})
export class AdminModule {}
