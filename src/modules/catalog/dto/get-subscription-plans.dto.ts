import { SubscriptionPlanKindEnum } from '@catalog/enums/subscription-plan-kind.enum';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class GetSubscriptionPlansDto {
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  activeOnly?: boolean;

  @IsEnum(SubscriptionPlanKindEnum)
  @IsOptional()
  kind?: SubscriptionPlanKindEnum;
}
