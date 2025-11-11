import { Module } from '@nestjs/common';
import { SubscriptionModule } from './subscription/subscription.module';
import { UserInfoModule } from './user-info/user-info.module';

@Module({
  imports: [SubscriptionModule, UserInfoModule],
})
export class UserModule {}
