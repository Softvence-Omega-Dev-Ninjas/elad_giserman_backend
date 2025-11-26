import { ApiProperty, PartialType } from '@nestjs/swagger';
import { BillingPeriod } from '@prisma';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty({
    description: 'Title of the subscription plan',
    example: 'Pro Plan',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Description of the subscription plan',
    example: 'Best for professionals who need advanced features.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'List of benefits included in the plan',
    example: [
      'Access to premium features',
      'Priority support',
      'Early access to new updates',
    ],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  benefits: string[];

  @ApiProperty({
    description: 'Whether this plan is marked as popular in UI',
    example: true,
    default: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isPopular?: boolean;

  @ApiProperty({
    description: 'Plan price in USD dollars',
    example: 9.99,
  })
  @Type(() => Number)
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Billing period for the plan',
    enum: BillingPeriod,
    example: BillingPeriod.MONTHLY,
  })
  @IsEnum(BillingPeriod)
  billingPeriod: BillingPeriod;

  @ApiProperty({
    description: 'Discount percentage applied to this plan (optional)',
    example: 20,
    default: 0,
    required: false,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;
}

export class UpdateSubscriptionPlanDto extends PartialType(
  CreateSubscriptionPlanDto,
) {}
