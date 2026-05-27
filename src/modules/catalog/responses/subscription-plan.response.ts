import { SubscriptionPlanKindEnum } from '@catalog/enums/subscription-plan-kind.enum';
import { SubscriptionPlanCodeEnum } from '@catalog/enums/subscription-plan-code.enum';
import { StripePriceIntervalEnum } from '@stripe/enums/stripe-price-interval.enum';

export class SubscriptionPlanPriceResponse {
  id: number;
  label?: string;
  billingInterval?: StripePriceIntervalEnum;
  intervalCount?: number;
  unitAmount: number;
  currency: string;
  isDefault: boolean;
  sortOrder: number;
}

export class SubscriptionPlanResponse {
  id: number;
  code: SubscriptionPlanCodeEnum;
  name: string;
  description?: string;
  kind: SubscriptionPlanKindEnum;
  sortOrder: number;
  includedGamesCount: number;
  prices: SubscriptionPlanPriceResponse[];
}
