import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class AdminActivityDto {
  @ApiProperty({
    description: 'Stripe connection status',
    example: true,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  stripeConnectionStatus?: boolean;

  @ApiProperty({
    description: 'Apple connection status',
    example: true,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  appleConnection?: boolean;

  @ApiProperty({
    description: 'Google connection status',
    example: false,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  googleConnection?: boolean;

  @ApiProperty({
    description: 'API keys stored as JSON string',
    example: '{"key1": "value1", "key2": "value2"}',
    required: false,
  })
  @IsString()
  @IsOptional()
  apiKeys?: string;

  @ApiProperty({
    description: 'Subscription status',
    example: true,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  subscriptionStatus?: boolean;

  @ApiProperty({
    description: 'Redemption status',
    example: false,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  reedemtionStatus?: boolean;

  @ApiProperty({
    description: 'Push notifications enabled status',
    example: true,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  pushNotifications?: boolean;

  @ApiProperty({
    description: 'Whether spin feature is available',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isSpinAvaiable?: boolean;

  @ApiProperty({
    description: 'Timestamp when the record was created',
    example: '2024-01-09T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the record was last updated',
    example: '2024-01-09T15:45:00.000Z',
    type: Date,
  })
  updatedAt: Date;
}

import { ApiPropertyOptional } from '@nestjs/swagger';

export enum RedemptionPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all-time',
}

export class RedemptionFilterDto {
  @ApiPropertyOptional({
    description: 'Time period for redemption data',
    enum: RedemptionPeriod,
    default: RedemptionPeriod.WEEKLY,
  })
  @IsEnum(RedemptionPeriod)
  @IsOptional()
  period?: RedemptionPeriod;
}
