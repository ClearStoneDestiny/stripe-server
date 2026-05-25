import { SubscriptionPlanCodeEnum } from '@catalog/enums/subscription-plan-code.enum';

export class SurprisePlanResponseDto {
  id: number;
  code: SubscriptionPlanCodeEnum;
  name: string;
}
