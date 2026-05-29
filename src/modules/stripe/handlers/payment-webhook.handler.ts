import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameTimeService } from '@catalog/game-time.service';
import { StripePayment } from '@stripe/entities/stripe-payment.entity';
import { StripePrice } from '@stripe/entities/stripe-price.entity';
import { StripePaymentFlowEnum } from '@stripe/enums/stripe-payment-flow.enum';
import { StripeService } from '@stripe/stripe.service';
import type { Stripe as StripeTypes } from 'node_modules/stripe/cjs/stripe.core';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentWebhookHandler {
  private readonly logger = new Logger(PaymentWebhookHandler.name);

  constructor(
    private readonly gameTimeService: GameTimeService,
    private readonly stripeService: StripeService,

    @InjectRepository(StripePayment)
    private readonly stripePaymentsRepository: Repository<StripePayment>,

    @InjectRepository(StripePrice)
    private readonly stripePricesRepository: Repository<StripePrice>,
  ) {}

  async onCheckoutCompleted(
    session: StripeTypes.Checkout.Session,
  ): Promise<void> {
    const metadata = session.metadata ?? {};
    const userId = this.parseMetadataNumber(metadata.userId);
    const hourPackCode = metadata.hourPackCode;

    this.logger.log(
      `Payment checkout completed: ${session.id}, user: ${userId}, pack: ${hourPackCode}`,
    );

    if (!userId) {
      this.logger.warn(`Checkout session ${session.id} has no userId metadata`);
      return;
    }

    const paymentIntentId = this.getStripeId(session.payment_intent);

    await this.upsertPaymentFromCheckoutSession(session, userId);

    if (hourPackCode && paymentIntentId) {
      await this.gameTimeService.creditFromPayment(
        userId,
        hourPackCode,
        paymentIntentId,
      );
    }
  }

  async onPaymentIntentSucceeded(
    paymentIntent: StripeTypes.PaymentIntent,
  ): Promise<void> {
    this.logger.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
    await this.upsertPaymentFromPaymentIntent(paymentIntent);

    const userId = this.parseMetadataNumber(paymentIntent.metadata?.userId);
    const hourPackCode = paymentIntent.metadata?.hourPackCode;

    if (userId && hourPackCode) {
      await this.gameTimeService.creditFromPayment(
        userId,
        hourPackCode,
        paymentIntent.id,
      );
    }
  }

  async onPaymentIntentFailed(
    paymentIntent: StripeTypes.PaymentIntent,
  ): Promise<void> {
    this.logger.warn(`PaymentIntent failed: ${paymentIntent.id}`);
    await this.upsertPaymentFromPaymentIntent(paymentIntent);
  }

  async onSetupIntentSucceeded(
    setupIntent: StripeTypes.SetupIntent,
  ): Promise<void> {
    this.logger.log(`Setup Intent succeeded: ${setupIntent.id}`);

    const subscriptionId = setupIntent.metadata?.subscriptionId;

    if (!subscriptionId) {
      this.logger.warn('Setup Intent has no subscription ID in metadata');
      return;
    }

    try {
      const paymentMethodId = setupIntent.payment_method as string;

      if (!paymentMethodId) {
        this.logger.error('Setup Intent has no payment method');
        return;
      }

      this.logger.log(
        `Updating subscription ${subscriptionId} with payment method ${paymentMethodId}`,
      );

      const subscription = await this.stripeService.client.subscriptions.update(
        subscriptionId,
        {
          default_payment_method: paymentMethodId,
        },
      );

      this.logger.log(
        `Subscription ${subscriptionId} updated with payment method`,
      );

      if (subscription.status === 'incomplete') {
        const latestInvoice = subscription.latest_invoice;
        const invoiceId =
          typeof latestInvoice === 'string' ? latestInvoice : latestInvoice?.id;

        if (invoiceId) {
          this.logger.log(`Paying first invoice ${invoiceId}`);

          try {
            const invoice = await this.stripeService.client.invoices.pay(
              invoiceId,
              {
                payment_method: paymentMethodId,
              },
            );

            this.logger.log(`Invoice ${invoiceId} paid successfully`);
            this.logger.log(`Invoice status: ${invoice.status}`);
          } catch (error) {
            this.logger.error(`Failed to pay invoice: ${error.message}`);
            throw error;
          }
        } else {
          this.logger.warn(
            `No invoice found for subscription ${subscriptionId}`,
          );
        }
      } else {
        this.logger.log(
          `Subscription ${subscriptionId} is already ${subscription.status}`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to update subscription after setup: ${error.message}`,
      );
      throw error;
    }
  }

  private async upsertPaymentFromCheckoutSession(
    session: StripeTypes.Checkout.Session,
    userId: number,
  ): Promise<void> {
    const paymentIntentId = this.getStripeId(session.payment_intent);
    const customerId = this.getStripeId(session.customer);
    const localCustomer = customerId
      ? await this.stripeService.syncCustomerByStripeId(customerId, userId)
      : null;
    const localPrice = await this.findPriceFromSession(session);

    const existingPayment = await this.stripePaymentsRepository.findOne({
      where: paymentIntentId
        ? { stripePaymentIntentId: paymentIntentId }
        : { stripeCheckoutSessionId: session.id },
    });

    const paymentPayload = {
      stripePaymentIntentId: paymentIntentId,
      stripeCheckoutSessionId: session.id,
      stripePaymentLinkId: this.getStripeId(session.payment_link),
      paymentFlow: session.payment_link
        ? StripePaymentFlowEnum.PAYMENT_LINK
        : StripePaymentFlowEnum.CHECKOUT,
      status: session.payment_status,
      amount: session.amount_total ?? 0,
      currency: session.currency ?? 'usd',
      livemode: session.livemode,
      metadata: session.metadata ?? {},
      userId,
      customerId: localCustomer?.id,
      priceId: localPrice?.id,
    };

    if (existingPayment) {
      await this.stripePaymentsRepository.update(
        existingPayment.id,
        paymentPayload,
      );
      return;
    }

    await this.stripePaymentsRepository.save(
      this.stripePaymentsRepository.create(paymentPayload),
    );
  }

  private async upsertPaymentFromPaymentIntent(
    paymentIntent: StripeTypes.PaymentIntent,
  ): Promise<void> {
    const userId = this.parseMetadataNumber(paymentIntent.metadata?.userId);
    const customerId = this.getStripeId(paymentIntent.customer);
    const localCustomer =
      customerId && userId
        ? await this.stripeService.syncCustomerByStripeId(customerId, userId)
        : null;
    const localPrice = await this.findPriceFromMetadata(
      paymentIntent.metadata?.stripePriceId,
    );
    const payment = await this.stripePaymentsRepository.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment && !userId) {
      this.logger.warn(
        `PaymentIntent ${paymentIntent.id} has no userId metadata`,
      );
      return;
    }

    const payload = {
      stripePaymentIntentId: paymentIntent.id,
      paymentFlow: StripePaymentFlowEnum.PAYMENT_ELEMENT,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      livemode: paymentIntent.livemode,
      metadata: paymentIntent.metadata ?? {},
      userId: payment?.userId ?? userId!,
      customerId: localCustomer?.id ?? payment?.customerId,
      priceId: localPrice?.id ?? payment?.priceId,
    };

    if (payment) {
      await this.stripePaymentsRepository.update(payment.id, payload);
      return;
    }

    await this.stripePaymentsRepository.save(
      this.stripePaymentsRepository.create(payload),
    );
  }

  private async findPriceFromSession(
    session: StripeTypes.Checkout.Session,
  ): Promise<StripePrice | null> {
    return this.findPriceFromMetadata(session.metadata?.stripePriceId);
  }

  private async findPriceFromMetadata(
    stripePriceId: string | undefined,
  ): Promise<StripePrice | null> {
    if (!stripePriceId) {
      return null;
    }

    return this.stripePricesRepository.findOne({
      where: { stripePriceId },
    });
  }

  private getStripeId(
    value: string | { id: string } | null | undefined,
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    return typeof value === 'string' ? value : value.id;
  }

  private parseMetadataNumber(value: string | undefined): number | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
