import { PaymentStrategyPayload } from '@stripe/interfaces/payment-strategy-payload.interfaces';
import { PaymentStrategyResult } from '@stripe/interfaces/payment-strategy-result.interfaces';

export interface PaymentStrategy {
  execute(payload: PaymentStrategyPayload): Promise<PaymentStrategyResult>;
}
