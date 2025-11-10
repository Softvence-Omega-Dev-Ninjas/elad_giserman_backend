import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { OrganizerModule } from './organizer/organizer.module';
import { UserModule } from './user/user.module';
import { ReviewModule } from './review/review.module';
// import { ReviewController } from './review/review.controller';


@Module({
  imports: [AuthModule, AdminModule, OrganizerModule, UserModule, ReviewModule],
  controllers: [],
  providers: [],
})
export class MainModule {}
