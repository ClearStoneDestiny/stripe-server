import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { HourPack } from '@catalog/entities/hour-pack.entity';
import { SubscriptionPlanPrice } from '@catalog/entities/subscription-plan-price.entity';
import { PaymentModeEnum } from '@stripe/enums/payment-mode.enum';
import { PaymentProviderEnum } from '@stripe/enums/payment-provider.enum';
import { PaymentStrategy } from '@stripe/interfaces/payment-strategy.interface';
import { PaymentStrategyPayload } from '@stripe/interfaces/payment-strategy-payload.interfaces';
import { PaymentStrategyResult } from '@stripe/interfaces/payment-strategy-result.interfaces';
import { CheckoutStrategy } from '@stripe/strategies/checkout.strategy';
import { PaymentElementStrategy } from '@stripe/strategies/payment-element.strategy';
import { PaymentLinkStrategy } from '@stripe/strategies/payment-link.strategy';
import { StripeService } from '@stripe/stripe.service';
import { User } from '@user/entities/user.entity';
import { In, Repository } from 'typeorm';
import { CreateBillingSessionDto } from '@stripe/dto/create-billing-session.dto';
import { StripeSubscription } from '@stripe/entities/stripe-subscription.entity';
import { StripeSubscriptionStatusEnum } from '@stripe/enums/stripe-subscription-status.enum';
import { CurrentSubscriptionResponse } from '@stripe/responses/current-subscription.response';

@Injectable()
export class BillingService {
  private readonly strategies: Record<PaymentProviderEnum, PaymentStrategy>;

  constructor(
    private readonly configService: ConfigService,
    private readonly stripeService: StripeService,

    @InjectRepository(SubscriptionPlanPrice)
    private readonly subscriptionPlanPricesRepository: Repository<SubscriptionPlanPrice>,

    @InjectRepository(HourPack)
    private readonly hourPacksRepository: Repository<HourPack>,

    @InjectRepository(StripeSubscription)
    private readonly stripeSubscriptionsRepository: Repository<StripeSubscription>,

    checkoutStrategy: CheckoutStrategy,
    paymentElementStrategy: PaymentElementStrategy,
    paymentLinkStrategy: PaymentLinkStrategy,
  ) {
    this.strategies = {
      [PaymentProviderEnum.CHECKOUT]: checkoutStrategy,
      [PaymentProviderEnum.PAYMENT_ELEMENT]: paymentElementStrategy,
      [PaymentProviderEnum.PAYMENT_LINK]: paymentLinkStrategy,
    };
  }

  async createBillingSession(
    dto: CreateBillingSessionDto,
    user: Partial<User>,
  ): Promise<PaymentStrategyResult> {
    if (!user.id || !user.email) {
      throw new UnauthorizedException('User is not authenticated');
    }

    const customer = await this.stripeService.getOrCreateCustomer({
      id: user.id,
      email: user.email,
    });
    const strategy = this.strategies[dto.provider];

    if (!strategy) {
      throw new BadRequestException('Unsupported payment provider');
    }

    const payload =
      dto.mode === PaymentModeEnum.SUBSCRIPTION
        ? await this.buildSubscriptionPayload(
            dto,
            customer.stripeCustomerId,
            user,
          )
        : await this.buildOneTimePaymentPayload(
            dto,
            customer.stripeCustomerId,
            user,
          );

    return strategy.execute(payload);
  }

  async getCurrentSubscription(
    user: Partial<User>,
  ): Promise<CurrentSubscriptionResponse> {
    if (!user.id) {
      throw new UnauthorizedException('User is not authenticated');
    }

    const subscription = await this.stripeSubscriptionsRepository.findOne({
      where: {
        userId: user.id,
        status: In([
          StripeSubscriptionStatusEnum.ACTIVE,
          StripeSubscriptionStatusEnum.TRIALING,
          StripeSubscriptionStatusEnum.PAST_DUE,
          StripeSubscriptionStatusEnum.INCOMPLETE,
        ]),
      },
      relations: {
        plan: true,
        price: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!subscription) {
      return { hasActiveAccess: false };
    }

    const hasActiveAccess = [
      StripeSubscriptionStatusEnum.ACTIVE,
      StripeSubscriptionStatusEnum.TRIALING,
    ].includes(subscription.status);

    return {
      hasActiveAccess,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
        trialEnd: subscription.trialEnd,
        plan: subscription.plan
          ? {
              id: subscription.plan.id,
              code: subscription.plan.code,
              name: subscription.plan.name,
              kind: subscription.plan.kind,
              sortOrder: subscription.plan.sortOrder,
            }
          : undefined,
        price: subscription.price
          ? {
              id: subscription.price.id,
              unitAmount: subscription.price.unitAmount,
              currency: subscription.price.currency,
              interval: subscription.price.interval,
              intervalCount: subscription.price.intervalCount,
            }
          : undefined,
      },
    };
  }

  private async buildSubscriptionPayload(
    dto: CreateBillingSessionDto,
    customerId: string,
    user: Partial<User>,
  ): Promise<PaymentStrategyPayload> {
    if (!dto.subscriptionPlanPriceId) {
      throw new BadRequestException('subscriptionPlanPriceId is required');
    }

    const planPrice = await this.subscriptionPlanPricesRepository.findOne({
      where: { id: dto.subscriptionPlanPriceId, active: true },
      relations: {
        plan: true,
        stripePrice: true,
      },
    });

    if (!planPrice) {
      throw new NotFoundException('Subscription plan price not found');
    }

    return {
      mode: PaymentModeEnum.SUBSCRIPTION,
      customerId,
      stripePriceId: planPrice.stripePrice.stripePriceId,
      successUrl: dto.successUrl ?? this.getClientUrl('/billing/success'),
      cancelUrl: dto.cancelUrl ?? this.getClientUrl('/billing/cancel'),
      metadata: {
        userId: String(user.id),
        subscriptionPlanId: String(planPrice.plan.id),
        subscriptionPlanPriceId: String(planPrice.id),
        stripePriceId: planPrice.stripePrice.stripePriceId,
      },
    };
  }

  private async buildOneTimePaymentPayload(
    dto: CreateBillingSessionDto,
    customerId: string,
    user: Partial<User>,
  ): Promise<PaymentStrategyPayload> {
    if (!dto.hourPackId) {
      throw new BadRequestException('hourPackId is required');
    }

    const hourPack = await this.hourPacksRepository.findOne({
      where: { id: dto.hourPackId, active: true },
      relations: {
        stripePrice: true,
      },
    });

    if (!hourPack) {
      throw new NotFoundException('Hour pack not found');
    }

    return {
      mode: PaymentModeEnum.PAYMENT,
      customerId,
      stripePriceId: hourPack.stripePrice.stripePriceId,
      amount: hourPack.stripePrice.unitAmount,
      currency: hourPack.stripePrice.currency,
      successUrl: dto.successUrl ?? this.getClientUrl('/billing/success'),
      cancelUrl: dto.cancelUrl ?? this.getClientUrl('/billing/cancel'),
      metadata: {
        userId: String(user.id),
        hourPackId: String(hourPack.id),
        hourPackCode: hourPack.code,
        stripePriceId: hourPack.stripePrice.stripePriceId,
      },
    };
  }

  private getClientUrl(path: string): string {
    const clientPort = this.configService.get<number>('CLIENT_PORT') ?? 5173;
    return `http://localhost:${clientPort}${path}`;
  }
}
