import { SubscriptionPlanCodeEnum } from '@catalog/enums/subscription-plan-code.enum';
import { SubscriptionPlanKindEnum } from '@catalog/enums/subscription-plan-kind.enum';
import { StripePriceIntervalEnum } from '@stripe/enums/stripe-price-interval.enum';
import { StripeSubscriptionStatusEnum } from '@stripe/enums/stripe-subscription-status.enum';

export class CurrentSubscriptionPlanResponse {
  id: number;
  code: SubscriptionPlanCodeEnum;
  name: string;
  kind: SubscriptionPlanKindEnum;
  sortOrder: number;
}

export class CurrentSubscriptionPriceResponse {
  id: number;
  unitAmount: number;
  currency: string;
  interval?: StripePriceIntervalEnum;
  intervalCount?: number;
}

export class CurrentSubscriptionItemResponse {
  id: number;
  status: StripeSubscriptionStatusEnum;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialEnd?: Date;
  plan?: CurrentSubscriptionPlanResponse;
  price?: CurrentSubscriptionPriceResponse;
}

export class CurrentSubscriptionResponse {
  hasActiveAccess: boolean;
  subscription?: CurrentSubscriptionItemResponse;
}
