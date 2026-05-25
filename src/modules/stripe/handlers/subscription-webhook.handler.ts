import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubscriptionPlan } from '@catalog/entities/subscription-plan.entity';
import { StripePrice } from '@stripe/entities/stripe-price.entity';
import { StripeSubscription } from '@stripe/entities/stripe-subscription.entity';
import { StripeSubscriptionItem } from '@stripe/entities/stripe-subscription-item.entity';
import { StripeSubscriptionStatusEnum } from '@stripe/enums/stripe-subscription-status.enum';
import { StripeService } from '@stripe/stripe.service';
import type { Stripe as StripeTypes } from 'node_modules/stripe/cjs/stripe.core';
import { Repository } from 'typeorm';

@Injectable()
export class SubscriptionWebhookHandler {
  private readonly logger = new Logger(SubscriptionWebhookHandler.name);

  constructor(
    private readonly stripeService: StripeService,

    @InjectRepository(StripeSubscription)
    private readonly stripeSubscriptionsRepository: Repository<StripeSubscription>,

    @InjectRepository(StripeSubscriptionItem)
    private readonly stripeSubscriptionItemsRepository: Repository<StripeSubscriptionItem>,

    @InjectRepository(StripePrice)
    private readonly stripePricesRepository: Repository<StripePrice>,

    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlansRepository: Repository<SubscriptionPlan>,
  ) {}

  async onCheckoutCompleted(
    session: StripeTypes.Checkout.Session,
  ): Promise<void> {
    const subscriptionId = this.getStripeId(session.subscription);

    if (!subscriptionId) {
      this.logger.warn(
        `Subscription checkout completed without subscription id: ${session.id}`,
      );
      return;
    }

    this.logger.log(`Subscription checkout completed: ${session.id}`);
  }

  async onCreated(subscription: StripeTypes.Subscription): Promise<void> {
    this.logger.log(`Subscription created: ${subscription.id}`);
    await this.upsertSubscription(subscription);
  }

  async onUpdated(subscription: StripeTypes.Subscription): Promise<void> {
    this.logger.log(`Subscription updated: ${subscription.id}`);
    await this.upsertSubscription(subscription);
  }

  async onDeleted(subscription: StripeTypes.Subscription): Promise<void> {
    this.logger.log(`Subscription deleted: ${subscription.id}`);
    await this.upsertSubscription(subscription);
  }

  async onInvoicePaid(invoice: StripeTypes.Invoice): Promise<void> {
    this.logger.log(`Invoice paid: ${invoice.id}`);

    const subscriptionId = this.getInvoiceSubscriptionId(invoice);

    if (!subscriptionId) {
      return;
    }

    await this.stripeSubscriptionsRepository.update(
      { stripeSubscriptionId: subscriptionId },
      { status: StripeSubscriptionStatusEnum.ACTIVE },
    );
  }

  async onInvoicePaymentFailed(invoice: StripeTypes.Invoice): Promise<void> {
    this.logger.warn(`Invoice payment failed: ${invoice.id}`);

    const subscriptionId = this.getInvoiceSubscriptionId(invoice);

    if (!subscriptionId) {
      return;
    }

    await this.stripeSubscriptionsRepository.update(
      { stripeSubscriptionId: subscriptionId },
      { status: StripeSubscriptionStatusEnum.PAST_DUE },
    );
  }

  private async upsertSubscription(
    subscription: StripeTypes.Subscription,
  ): Promise<void> {
    const customerId = this.getStripeId(subscription.customer);
    const metadataUserId = this.parseMetadataNumber(
      subscription.metadata?.userId,
    );
    const customer = customerId
      ? await this.stripeService.syncCustomerByStripeId(
          customerId,
          metadataUserId,
        )
      : null;

    if (!customer) {
      this.logger.warn(
        `Local Stripe customer not found for subscription ${subscription.id}`,
      );
      return;
    }

    const primaryItem = subscription.items.data[0];
    const primaryPrice = primaryItem
      ? await this.stripePricesRepository.findOne({
          where: { stripePriceId: primaryItem.price.id },
        })
      : null;
    const plan = await this.findPlan(subscription);
    const existingSubscription =
      await this.stripeSubscriptionsRepository.findOne({
        where: { stripeSubscriptionId: subscription.id },
      });
    const period = this.getSubscriptionPeriod(subscription);

    const payload = {
      stripeSubscriptionId: subscription.id,
      status: subscription.status as StripeSubscriptionStatusEnum,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: this.fromUnix(subscription.canceled_at),
      trialEnd: this.fromUnix(subscription.trial_end),
      livemode: subscription.livemode,
      metadata: subscription.metadata ?? {},
      userId: customer.userId,
      customerId: customer.id,
      priceId: primaryPrice?.id,
      planId: plan?.id,
    };

    const localSubscription = existingSubscription
      ? await this.updateSubscription(existingSubscription.id, payload)
      : await this.createSubscription(payload);

    await this.syncSubscriptionItems(localSubscription.id, subscription);
  }

  private async createSubscription(
    payload: Partial<StripeSubscription>,
  ): Promise<StripeSubscription> {
    return this.stripeSubscriptionsRepository.save(
      this.stripeSubscriptionsRepository.create(payload),
    );
  }

  private async updateSubscription(
    id: number,
    payload: Partial<StripeSubscription>,
  ): Promise<StripeSubscription> {
    const subscription = await this.stripeSubscriptionsRepository.findOneOrFail(
      { where: { id } },
    );

    Object.assign(subscription, payload);

    return this.stripeSubscriptionsRepository.save(subscription);
  }

  private async syncSubscriptionItems(
    localSubscriptionId: number,
    subscription: StripeTypes.Subscription,
  ): Promise<void> {
    for (const item of subscription.items.data) {
      const localPrice = await this.stripePricesRepository.findOne({
        where: { stripePriceId: item.price.id },
      });

      if (!localPrice) {
        continue;
      }

      const existingItem = await this.stripeSubscriptionItemsRepository.findOne(
        {
          where: { stripeSubscriptionItemId: item.id },
        },
      );

      const payload = {
        stripeSubscriptionItemId: item.id,
        quantity: item.quantity ?? 1,
        subscriptionId: localSubscriptionId,
        priceId: localPrice.id,
      };

      if (existingItem) {
        await this.stripeSubscriptionItemsRepository.update(
          existingItem.id,
          payload,
        );
        continue;
      }

      await this.stripeSubscriptionItemsRepository.save(
        this.stripeSubscriptionItemsRepository.create(payload),
      );
    }
  }

  private async findPlan(
    subscription: StripeTypes.Subscription,
  ): Promise<SubscriptionPlan | null> {
    const planId = this.parseMetadataNumber(
      subscription.metadata?.subscriptionPlanId,
    );

    if (planId) {
      const plan = await this.subscriptionPlansRepository.findOne({
        where: { id: planId },
      });

      if (plan) {
        return plan;
      }
    }

    const firstPriceId = subscription.items.data[0]?.price.id;

    if (!firstPriceId) {
      return null;
    }

    return this.subscriptionPlansRepository
      .createQueryBuilder('plan')
      .leftJoin('plan.prices', 'planPrice')
      .leftJoin('planPrice.stripePrice', 'stripePrice')
      .where('stripePrice.stripePriceId = :firstPriceId', { firstPriceId })
      .getOne();
  }

  private fromUnix(value: number | null | undefined): Date | undefined {
    if (!value) {
      return undefined;
    }

    return new Date(value * 1000);
  }

  private getInvoiceSubscriptionId(
    invoice: StripeTypes.Invoice,
  ): string | undefined {
    const invoiceWithSubscription = invoice as unknown as {
      subscription?: string | { id: string } | null;
      parent?: {
        subscription_details?: {
          subscription?: string | { id: string } | null;
        } | null;
      } | null;
    };

    return this.getStripeId(
      invoiceWithSubscription.subscription ??
        invoiceWithSubscription.parent?.subscription_details?.subscription ??
        null,
    );
  }

  private getSubscriptionPeriod(subscription: StripeTypes.Subscription): {
    start?: Date;
    end?: Date;
  } {
    const subscriptionWithPeriod = subscription as unknown as {
      current_period_start?: number | null;
      current_period_end?: number | null;
    };
    const firstItemWithPeriod = subscription.items.data[0] as
      | {
          current_period_start?: number | null;
          current_period_end?: number | null;
        }
      | undefined;

    return {
      start: this.fromUnix(
        subscriptionWithPeriod.current_period_start ??
          firstItemWithPeriod?.current_period_start,
      ),
      end: this.fromUnix(
        subscriptionWithPeriod.current_period_end ??
          firstItemWithPeriod?.current_period_end,
      ),
    };
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
