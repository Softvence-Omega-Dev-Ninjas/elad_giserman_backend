import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { OrganizerModule } from './organizer/organizer.module';
import { UserModule } from './user/user.module';
import { ReviewModule } from './review/review.module';
// import { ReviewController } from './review/review.controller';
import { UserReservationModule } from './user-reservation/user-reservation.module';

@Module({
  imports: [
    AuthModule,
    AdminModule,
    OrganizerModule,
    UserModule,
    ReviewModule,
    UserReservationModule,
  ],
  controllers: [],
  providers: [],
})
export class MainModule {}
