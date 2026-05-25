import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentModeEnum } from '@stripe/enums/payment-mode.enum';
import { PaymentProviderEnum } from '@stripe/enums/payment-provider.enum';
import { PaymentStrategyPayload } from '@stripe/interfaces/payment-strategy-payload.interfaces';
import { PaymentStrategyResult } from '@stripe/interfaces/payment-strategy-result.interfaces';
import { PaymentStrategy } from '@stripe/interfaces/payment-strategy.interface';
import { StripeService } from '@stripe/stripe.service';
import type { Stripe as StripeTypes } from 'node_modules/stripe/cjs/stripe.core';

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
      },
      expand: ['latest_invoice'],
      metadata: payload.metadata,
    });

    const clientSecret = this.getSubscriptionClientSecret(subscription);

    if (!clientSecret) {
      throw new BadRequestException(
        'Stripe subscription has no invoice confirmation secret',
      );
    }

    return {
      type: PaymentProviderEnum.PAYMENT_ELEMENT,
      clientSecret,
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

  private getSubscriptionClientSecret(
    subscription: StripeTypes.Subscription,
  ): string | undefined {
    const latestInvoice = subscription.latest_invoice as
      | (StripeTypes.Invoice & {
          confirmation_secret?: { client_secret?: string | null } | null;
        })
      | null;

    return latestInvoice?.confirmation_secret?.client_secret ?? undefined;
  }
}
