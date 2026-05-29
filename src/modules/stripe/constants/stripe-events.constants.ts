export const STRIPE_EVENTS = {
  // Checkout
  CHECKOUT_SESSION_COMPLETED: 'checkout.session.completed',
  CHECKOUT_SESSION_ASYNC_PAYMENT_SUCCEEDED:
    'checkout.session.async_payment_succeeded',
  CHECKOUT_SESSION_ASYNC_PAYMENT_FAILED:
    'checkout.session.async_payment_failed',
  CHECKOUT_SESSION_EXPIRED: 'checkout.session.expired',

  // Subscriptions
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',

  // Invoices
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  INVOICE_UPCOMING: 'invoice.upcoming',

  // One time payments
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',
  SETUP_INTENT_SUCCEEDED: 'setup_intent.succeeded',
} as const;

export type StripeEventType =
  (typeof STRIPE_EVENTS)[keyof typeof STRIPE_EVENTS];
