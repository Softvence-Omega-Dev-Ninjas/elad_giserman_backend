import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OfferStatus } from '@prisma';

export class AdminUpdateOfferDto {
  @ApiProperty({
    example: 'APPROVED',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
  })
  @IsEnum(OfferStatus)
  status: OfferStatus;
}
