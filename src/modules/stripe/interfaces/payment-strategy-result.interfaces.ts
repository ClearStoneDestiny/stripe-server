import { PaymentProviderEnum } from '@stripe/enums/payment-provider.enum';

export interface PaymentStrategyResult {
  type: PaymentProviderEnum;
  url?: string;
  clientSecret?: string;
  sessionId?: string;
  paymentIntentId?: string;
  paymentLinkId?: string;
  subscriptionId?: string;
}
