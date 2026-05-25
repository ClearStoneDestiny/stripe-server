import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { Stripe as StripeTypes } from 'node_modules/stripe/cjs/stripe.core';
import { Repository } from 'typeorm';
import { STRIPE_EVENTS } from '@stripe/constants/stripe-events.constants';
import { SubscriptionWebhookHandler } from '@stripe/handlers/subscription-webhook.handler';
import { PaymentWebhookHandler } from '@stripe/handlers/payment-webhook.handler';
import { StripeService } from '@stripe/stripe.service';
import { StripeWebhookEvent } from '@stripe/entities/stripe-webhook-event.entity';
import { StripeWebhookProcessingStatusEnum } from '@stripe/enums/stripe-webhook-processing-status.enum';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    private readonly subscriptionWebhookHandler: SubscriptionWebhookHandler,
    private readonly paymentWebhookHandler: PaymentWebhookHandler,

    @InjectRepository(StripeWebhookEvent)
    private readonly webhookEventsRepository: Repository<StripeWebhookEvent>,
  ) {}

  async handleWebhook(
    rawBody: Buffer | undefined,
    signature: string,
  ): Promise<void> {
    const event = this.constructEvent(rawBody, signature);

    this.logger.log(`Stripe event received: ${event.type} [${event.id}]`);

    const webhookEvent = await this.registerEvent(event);

    if (webhookEvent.status === StripeWebhookProcessingStatusEnum.PROCESSED) {
      this.logger.log(`Stripe event already processed: ${event.id}`);
      return;
    }

    try {
      await this.routeEvent(event);
      await this.markEventProcessed(webhookEvent);
    } catch (error) {
      this.logger.error(
        `Failed to handle event ${event.type} [${event.id}]`,
        error,
      );
      await this.markEventFailed(webhookEvent, error);
      throw new InternalServerErrorException(
        'Failed to process Stripe webhook',
      );
    }
  }

  private constructEvent(
    rawBody: Buffer | undefined,
    signature: string,
  ): StripeTypes.Event {
    if (!rawBody) {
      throw new BadRequestException('Missing raw webhook body');
    }

    try {
      return this.stripeService.client.webhooks.constructEvent(
        rawBody,
        signature,
        this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET'),
      );
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  private async registerEvent(
    event: StripeTypes.Event,
  ): Promise<StripeWebhookEvent> {
    const existingEvent = await this.webhookEventsRepository.findOne({
      where: { stripeEventId: event.id },
    });

    if (existingEvent) {
      return existingEvent;
    }

    const webhookEvent = this.webhookEventsRepository.create({
      stripeEventId: event.id,
      type: event.type,
      status: StripeWebhookProcessingStatusEnum.PENDING,
      livemode: event.livemode,
      payload: event as unknown as Record<string, unknown>,
    });

    try {
      return await this.webhookEventsRepository.save(webhookEvent);
    } catch (error) {
      const eventCreatedByConcurrentRequest =
        await this.webhookEventsRepository.findOne({
          where: { stripeEventId: event.id },
        });

      if (eventCreatedByConcurrentRequest) {
        return eventCreatedByConcurrentRequest;
      }

      throw error;
    }
  }

  private async markEventProcessed(event: StripeWebhookEvent): Promise<void> {
    await this.webhookEventsRepository.update(event.id, {
      status: StripeWebhookProcessingStatusEnum.PROCESSED,
      processedAt: new Date(),
      failureReason: undefined,
    });
  }

  private async markEventFailed(
    event: StripeWebhookEvent,
    error: unknown,
  ): Promise<void> {
    await this.webhookEventsRepository.update(event.id, {
      status: StripeWebhookProcessingStatusEnum.FAILED,
      failureReason: this.getErrorMessage(error),
    });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown webhook processing error';
  }

  private async routeEvent(event: StripeTypes.Event): Promise<void> {
    switch (event.type) {
      /**
       * Checkout
       * shared for subscriptions and one-time purchases
       */
      case STRIPE_EVENTS.CHECKOUT_SESSION_COMPLETED:
        await this.handleCheckoutCompleted(event);
        break;

      case STRIPE_EVENTS.CHECKOUT_SESSION_ASYNC_PAYMENT_SUCCEEDED:
        await this.handleCheckoutCompleted(event);
        break;

      case STRIPE_EVENTS.CHECKOUT_SESSION_ASYNC_PAYMENT_FAILED:
        this.logger.warn(`Checkout async payment failed: ${event.id}`);
        break;

      case STRIPE_EVENTS.CHECKOUT_SESSION_EXPIRED:
        this.logger.warn(`Checkout expired: ${event.id}`);
        break;

      /**
       * Subscription
       */
      case STRIPE_EVENTS.SUBSCRIPTION_CREATED:
        await this.subscriptionWebhookHandler.onCreated(
          event.data.object as StripeTypes.Subscription,
        );
        break;

      case STRIPE_EVENTS.SUBSCRIPTION_UPDATED:
        await this.subscriptionWebhookHandler.onUpdated(
          event.data.object as StripeTypes.Subscription,
        );
        break;

      case STRIPE_EVENTS.SUBSCRIPTION_DELETED:
        await this.subscriptionWebhookHandler.onDeleted(
          event.data.object as StripeTypes.Subscription,
        );
        break;

      /**
       * Invoices
       */
      case STRIPE_EVENTS.INVOICE_PAID:
        await this.subscriptionWebhookHandler.onInvoicePaid(
          event.data.object as StripeTypes.Invoice,
        );
        break;

      case STRIPE_EVENTS.INVOICE_PAYMENT_FAILED:
        await this.subscriptionWebhookHandler.onInvoicePaymentFailed(
          event.data.object as StripeTypes.Invoice,
        );
        break;

      /**
       * One time payments
       */
      case STRIPE_EVENTS.PAYMENT_INTENT_SUCCEEDED:
        await this.paymentWebhookHandler.onPaymentIntentSucceeded(
          event.data.object as StripeTypes.PaymentIntent,
        );
        break;

      case STRIPE_EVENTS.PAYMENT_INTENT_FAILED:
        await this.paymentWebhookHandler.onPaymentIntentFailed(
          event.data.object as StripeTypes.PaymentIntent,
        );
        break;

      default:
        this.logger.debug(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(
    event: StripeTypes.Event,
  ): Promise<void> {
    const session = event.data.object as StripeTypes.Checkout.Session;

    if (session.mode === 'subscription') {
      await this.subscriptionWebhookHandler.onCheckoutCompleted(session);
    } else if (session.mode === 'payment') {
      await this.paymentWebhookHandler.onCheckoutCompleted(session);
    }
  }
}
