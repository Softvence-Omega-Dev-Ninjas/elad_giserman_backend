import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({
    example: 'ad12b53d-882a-4f29-b2fb-5ff3c98917e7',
    description: 'Restaurant (BusinessProfile) ID',
  })
  @IsUUID()
  restaurntId: string;

  @ApiProperty({
    example: '2025-02-10',
    description: 'Reservation date in YYYY-MM-DD format',
  })
  @IsString()
  date: string;

  @ApiProperty({
    example: '19:30',
    description: 'Reservation time (HH:mm format)',
  })
  @IsString()
  time: string;

  @ApiProperty({
    example: '+8801770001122',
    description: 'User contact phone number',
  })
  @IsString()
  phoneNumber: string;
}
