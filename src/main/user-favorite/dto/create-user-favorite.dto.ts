import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty({
    example: 'aa30ea01-d06f-4d17-9eff-057a5e5e46f4',
    description: 'Restaurant (BusinessProfile) ID',
  })
  @IsNotEmpty()
  @IsString()
  restaurantId: string;
}
