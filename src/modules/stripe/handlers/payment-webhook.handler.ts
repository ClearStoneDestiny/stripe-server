import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameTimeService } from '@catalog/game-time.service';
import { StripeCustomer } from '@stripe/entities/stripe-customer.entity';
import { StripePayment } from '@stripe/entities/stripe-payment.entity';
import { StripePrice } from '@stripe/entities/stripe-price.entity';
import { StripePaymentFlowEnum } from '@stripe/enums/stripe-payment-flow.enum';
import type { Stripe as StripeTypes } from 'node_modules/stripe/cjs/stripe.core';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentWebhookHandler {
  private readonly logger = new Logger(PaymentWebhookHandler.name);

  constructor(
    private readonly gameTimeService: GameTimeService,

    @InjectRepository(StripePayment)
    private readonly stripePaymentsRepository: Repository<StripePayment>,

    @InjectRepository(StripeCustomer)
    private readonly stripeCustomersRepository: Repository<StripeCustomer>,

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
    await this.updatePaymentIntentStatus(paymentIntent);
  }

  async onPaymentIntentFailed(
    paymentIntent: StripeTypes.PaymentIntent,
  ): Promise<void> {
    this.logger.warn(`PaymentIntent failed: ${paymentIntent.id}`);
    await this.updatePaymentIntentStatus(paymentIntent);
  }

  private async upsertPaymentFromCheckoutSession(
    session: StripeTypes.Checkout.Session,
    userId: number,
  ): Promise<void> {
    const paymentIntentId = this.getStripeId(session.payment_intent);
    const customerId = this.getStripeId(session.customer);
    const localCustomer = customerId
      ? await this.stripeCustomersRepository.findOne({
          where: { stripeCustomerId: customerId },
        })
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

  private async updatePaymentIntentStatus(
    paymentIntent: StripeTypes.PaymentIntent,
  ): Promise<void> {
    const payment = await this.stripePaymentsRepository.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      return;
    }

    await this.stripePaymentsRepository.update(payment.id, {
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      livemode: paymentIntent.livemode,
      metadata: paymentIntent.metadata ?? {},
    });
  }

  private async findPriceFromSession(
    session: StripeTypes.Checkout.Session,
  ): Promise<StripePrice | null> {
    const stripePriceId = session.metadata?.stripePriceId;

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
