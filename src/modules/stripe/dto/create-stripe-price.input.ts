import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { StripePriceTypeEnum } from '@stripe/enums/stripe-price-type.enum';
import { StripePriceIntervalEnum } from '@stripe/enums/stripe-price-interval.enum';

export class CreateStripePriceInput {
  @IsString()
  productId: string;

  @IsString()
  currency: string;

  /**
   * Amount in cents
   * 1000 = 10$
   */
  @IsInt()
  @Min(1)
  unitAmount: number;

  @IsEnum(StripePriceTypeEnum)
  type: StripePriceTypeEnum;

  @IsOptional()
  @IsEnum(StripePriceIntervalEnum)
  interval?: StripePriceIntervalEnum;

  @IsOptional()
  @IsInt()
  intervalCount?: number;

  @IsOptional()
  @IsString()
  lookupKey?: string;
}
