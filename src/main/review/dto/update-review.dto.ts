import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateReviewDto {
  @ApiProperty({
    example: 'Great service and friendly staff!',
  })
  @IsString()
  @IsNotEmpty()
  comment: string;

  @ApiProperty({
    example: 5,
  })
  @IsNumber()
  @IsNotEmpty()
  rating: number;
}
