import { PaymentModeEnum } from '@stripe/enums/payment-mode.enum';

export interface PaymentStrategyPayload {
  customerId: string;
  stripePriceId: string;
  amount?: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  mode: PaymentModeEnum;
}
