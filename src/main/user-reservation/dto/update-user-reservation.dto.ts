import { PartialType } from '@nestjs/swagger';
import { CreateReservationDto } from './create-user-reservation.dto';

export class UpdateUserReservationDto extends PartialType(
  CreateReservationDto,
) {}
