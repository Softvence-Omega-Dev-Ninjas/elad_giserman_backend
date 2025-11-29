import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateUserTermsAndConditionsDto {
  @ApiProperty({
    example: 'This is the general agreement text...',
    required: false,
  })
  @IsOptional()
  @IsString()
  generalAgrement?: string;

  @ApiProperty({
    example: ['All reservations must be confirmed via email.'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  reservationConfirmation: string[];

  @ApiProperty({
    example: ['Guests must arrive 10 minutes early.'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  arrvalAndSeatingPolicy: string[];

  @ApiProperty({
    example: ['Cancellations must be made 24 hours in advance.'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  canceletionAndNoShows: string[];

  @ApiProperty({
    example: ['Changes to reservation must be requested via phone.'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  modifications: string[];

  @ApiProperty({
    example: ['Guests must behave respectfully on premises.'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  conductAndBehaviour: string[];

  @ApiProperty({
    example: 'We may update policies at any time.',
    required: false,
  })
  @IsOptional()
  @IsString()
  policyUpdate?: string;

  @ApiProperty({
    example: 'Business is not responsible for lost items.',
  })
  @IsString()
  liability: string;
}



export class UpdateUserTermsAndConditionsDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  generalAgrement?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reservationConfirmation?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  arrvalAndSeatingPolicy?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  canceletionAndNoShows?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modifications?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  conductAndBehaviour?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  policyUpdate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  liability?: string;
}
