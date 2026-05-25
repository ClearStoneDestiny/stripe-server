import { Injectable, Logger } from '@nestjs/common';
import type { Stripe as StripeTypes } from 'node_modules/stripe/cjs/stripe.core';

@Injectable()
export class PaymentWebhookHandler {
  private readonly logger = new Logger(PaymentWebhookHandler.name);

  async onCheckoutCompleted(
    session: StripeTypes.Checkout.Session,
  ): Promise<void> {
    const { userId, hourPackCode } = session.metadata ?? {};
    this.logger.log(
      `Payment checkout completed: ${session.id}, user: ${userId}, pack: ${hourPackCode}`,
    );
    // TODO: call gameTimeService.creditFromPayment(...)
  }

  async onPaymentIntentSucceeded(
    paymentIntent: StripeTypes.PaymentIntent,
  ): Promise<void> {
    // Additional security - core logic via checkout.session.completed
    // Here can only log or update the StripePayment status in the database
    this.logger.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
  }

  async onPaymentIntentFailed(
    paymentIntent: StripeTypes.PaymentIntent,
  ): Promise<void> {
    // TODO: notify the user about a payment error
    this.logger.warn(`PaymentIntent failed: ${paymentIntent.id}`);
  }
}
