import { Injectable, Logger } from '@nestjs/common';
import type { Stripe as StripeTypes } from 'node_modules/stripe/cjs/stripe.core';

@Injectable()
export class SubscriptionWebhookHandler {
  private readonly logger = new Logger(SubscriptionWebhookHandler.name);

  async onCheckoutCompleted(
    session: StripeTypes.Checkout.Session,
  ): Promise<void> {
    // TODO: Make sure the subscription is activated and link it to the user
    this.logger.log(`Subscription checkout completed: ${session.id}`);
  }

  async onCreated(subscription: StripeTypes.Subscription): Promise<void> {
    // TODO:create/update UserSubscription in the database
    this.logger.log(`Subscription created: ${subscription.id}`);
  }

  async onUpdated(subscription: StripeTypes.Subscription): Promise<void> {
    // TODO: Update the status, plan, and dates in UserSubscription
    this.logger.log(`Subscription updated: ${subscription.id}`);
  }

  async onDeleted(subscription: StripeTypes.Subscription): Promise<void> {
    // TODO: deactivate UserSubscription
    this.logger.log(`Subscription deleted: ${subscription.id}`);
  }

  async onInvoicePaid(invoice: StripeTypes.Invoice): Promise<void> {
    // TODO: extend the subscription period, create a payment record
    this.logger.log(`Invoice paid: ${invoice.id}`);
  }

  async onInvoicePaymentFailed(invoice: StripeTypes.Invoice): Promise<void> {
    // TODO: Mark the subscription as past_due, notify the user
    this.logger.warn(`Invoice payment failed: ${invoice.id}`);
  }
}
