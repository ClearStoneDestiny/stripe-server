import { Injectable } from '@nestjs/common';
import { PaymentStrategy } from '@stripe/interfaces/payment-strategy.interface';
import { StripeService } from '@stripe/stripe.service';
import { PaymentStrategyPayload } from '@stripe/interfaces/payment-strategy-payload.interfaces';
import { PaymentStrategyResult } from '@stripe/interfaces/payment-strategy-result.interfaces';
import { PaymentProviderEnum } from '@stripe/enums/payment-provider.enum';
import { PaymentModeEnum } from '@stripe/enums/payment-mode.enum';

@Injectable()
export class PaymentLinkStrategy implements PaymentStrategy {
  constructor(private readonly stripeService: StripeService) {}

  async execute(
    payload: PaymentStrategyPayload,
  ): Promise<PaymentStrategyResult> {
    const link = await this.stripeService.client.paymentLinks.create({
      line_items: [
        {
          price: payload.stripePriceId,
          quantity: 1,
        },
      ],
      metadata: payload.metadata,
      after_completion: {
        type: 'redirect',
        redirect: {
          url: payload.successUrl,
        },
      },
      customer_creation:
        payload.mode === PaymentModeEnum.PAYMENT ? 'always' : undefined,
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
      type: PaymentProviderEnum.PAYMENT_LINK,
      url: link.url,
      paymentLinkId: link.id,
    };
  }
}
