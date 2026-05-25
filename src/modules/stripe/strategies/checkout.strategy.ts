import { Injectable } from '@nestjs/common';
import { PaymentStrategy } from '@stripe/interfaces/payment-strategy.interface';
import { StripeService } from '@stripe/stripe.service';
import { PaymentStrategyPayload } from '@stripe/interfaces/payment-strategy-payload.interfaces';
import { PaymentStrategyResult } from '@stripe/interfaces/payment-strategy-result.interfaces';
import { PaymentProviderEnum } from '@stripe/enums/payment-provider.enum';
import { PaymentModeEnum } from '@stripe/enums/payment-mode.enum';

@Injectable()
export class CheckoutStrategy implements PaymentStrategy {
  constructor(private readonly stripeService: StripeService) {}

  async execute(
    payload: PaymentStrategyPayload,
  ): Promise<PaymentStrategyResult> {
    const session = await this.stripeService.client.checkout.sessions.create({
      mode: payload.mode,
      customer: payload.customerId,
      client_reference_id: payload.metadata?.userId,

      line_items: [
        {
          price: payload.stripePriceId,
          quantity: 1,
        },
      ],

      success_url: payload.successUrl,
      cancel_url: payload.cancelUrl,
      metadata: payload.metadata,
      payment_intent_data:
        payload.mode === PaymentModeEnum.PAYMENT
          ? {
              metadata: payload.metadata,
            }
          : undefined,
      subscription_data:
        payload.mode === PaymentModeEnum.SUBSCRIPTION
          ? {
              metadata: payload.metadata,
            }
          : undefined,
    });

    return {
      type: PaymentProviderEnum.CHECKOUT,
      url: session.url ?? undefined,
      sessionId: session.id,
    };
  }
}
