import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBusinessProfileDto {
  @ApiProperty({ example: 'The Coffee Spot (Updated)', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    example: 'Cozy cafe with a new outdoor section',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Gulshan, Dhaka', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({ example: '09:00 AM', required: false })
  @IsOptional()
  @IsString()
  openingTime?: string;

  @ApiProperty({ example: '11:00 PM', required: false })
  @IsOptional()
  @IsString()
  closingTime?: string;

  @ApiProperty({
    description: 'Existing gallery images coming from client',
    required: false,
    type: 'string',
    example: JSON.stringify([
      {
        id: '94abf1c3-6a40-4dcf-bf9e-3a366c124769',
        filename: 'b0192c68-5d4e-4aa6-a0a5-77d8babbd6f2.png',
        originalFilename: 'Screenshot.png',
        path: 'images/b0192c68.png',
        url: 'https://eladserver.s3/.../b0192c68.png',
        fileType: 'image',
        mimeType: 'image/png',
        size: 98623,
      },
    ]),
  })
  @IsOptional()
  @IsString()
  existingImages?: string;

  @ApiProperty({
    type: 'string',
    example: 'here will go profile type name',
    required: false,
  })
  @IsOptional()
  @IsString()
  profileTypeName?: string;

  @ApiProperty({
    example: 'categoryId123',
    required: false,
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({
    example: 'BAR',
    required: false,
  })
  @IsOptional()
  @IsString()
  categoryName?: string;
}
