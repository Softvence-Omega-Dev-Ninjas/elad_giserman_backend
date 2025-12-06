import { Module } from '@nestjs/common';
import { UserReservationService } from './user-reservation.service';
import { UserReservationController } from './user-reservation.controller';

@Module({
  controllers: [UserReservationController],
  providers: [UserReservationService],
})
export class UserReservationModule {}
