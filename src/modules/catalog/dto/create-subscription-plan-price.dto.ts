import { StripePriceIntervalEnum } from '@stripe/enums/stripe-price-interval.enum';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSubscriptionPlanPriceDto {
  @IsInt()
  planId: number;

  @IsInt()
  stripePriceId: number;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsEnum(StripePriceIntervalEnum)
  billingInterval?: StripePriceIntervalEnum;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
