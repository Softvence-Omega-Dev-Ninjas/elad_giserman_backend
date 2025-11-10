import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateReviewDto } from './create-review.dto';
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
