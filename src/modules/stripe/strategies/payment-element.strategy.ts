import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentModeEnum } from '@stripe/enums/payment-mode.enum';
import { PaymentProviderEnum } from '@stripe/enums/payment-provider.enum';
import { PaymentStrategyPayload } from '@stripe/interfaces/payment-strategy-payload.interfaces';
import { PaymentStrategyResult } from '@stripe/interfaces/payment-strategy-result.interfaces';
import { PaymentStrategy } from '@stripe/interfaces/payment-strategy.interface';
import { StripeService } from '@stripe/stripe.service';

@Injectable()
export class PaymentElementStrategy implements PaymentStrategy {
  constructor(private readonly stripeService: StripeService) {}

  async execute(
    payload: PaymentStrategyPayload,
  ): Promise<PaymentStrategyResult> {
    if (payload.mode === PaymentModeEnum.SUBSCRIPTION) {
      return this.createSubscription(payload);
    }

    return this.createPaymentIntent(payload);
  }

  private async createSubscription(
    payload: PaymentStrategyPayload,
  ): Promise<PaymentStrategyResult> {
    const subscription = await this.stripeService.client.subscriptions.create({
      customer: payload.customerId,
      items: [
        {
          price: payload.stripePriceId,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      expand: ['latest_invoice'],
      metadata: {
        ...payload.metadata,
      },
    });

    const setupIntent = await this.stripeService.client.setupIntents.create({
      customer: payload.customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        ...payload.metadata,
        subscriptionId: subscription.id,
        type: 'subscription_setup',
      },
    });

    if (!setupIntent.client_secret) {
      throw new BadRequestException('Setup intent has no client secret');
    }

    return {
      type: PaymentProviderEnum.PAYMENT_ELEMENT,
      clientSecret: setupIntent.client_secret,
      subscriptionId: subscription.id,
    };
  }

  private async createPaymentIntent(
    payload: PaymentStrategyPayload,
  ): Promise<PaymentStrategyResult> {
    if (!payload.amount || !payload.currency) {
      throw new BadRequestException('Payment amount and currency are required');
    }

    const paymentIntent = await this.stripeService.client.paymentIntents.create(
      {
        amount: payload.amount,
        currency: payload.currency,
        customer: payload.customerId,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: payload.metadata,
      },
    );

    return {
      type: PaymentProviderEnum.PAYMENT_ELEMENT,
      clientSecret: paymentIntent.client_secret ?? undefined,
      paymentIntentId: paymentIntent.id,
    };
  }
}
