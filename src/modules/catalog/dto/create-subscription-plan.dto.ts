import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { SubscriptionPlanCodeEnum } from '@catalog/enums/subscription-plan-code.enum';
import { SubscriptionPlanKindEnum } from '@catalog/enums/subscription-plan-kind.enum';

export class CreateSubscriptionPlanDto {
  @IsEnum(SubscriptionPlanCodeEnum)
  code: SubscriptionPlanCodeEnum;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(SubscriptionPlanKindEnum)
  kind: SubscriptionPlanKindEnum;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  /**
   * local StripeProduct DB id
   */
  @IsOptional()
  @IsInt()
  stripeProductId?: number;
}
