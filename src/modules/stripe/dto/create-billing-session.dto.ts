import { PaymentModeEnum } from '@stripe/enums/payment-mode.enum';
import { PaymentProviderEnum } from '@stripe/enums/payment-provider.enum';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateBillingSessionDto {
  @IsEnum(PaymentProviderEnum)
  provider: PaymentProviderEnum;

  @IsEnum(PaymentModeEnum)
  mode: PaymentModeEnum;

  @ValidateIf(
    (dto: CreateBillingSessionDto) => dto.mode === PaymentModeEnum.SUBSCRIPTION,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subscriptionPlanPriceId?: number;

  @ValidateIf(
    (dto: CreateBillingSessionDto) => dto.mode === PaymentModeEnum.PAYMENT,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hourPackId?: number;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
