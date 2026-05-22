import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubscriptionPlanDto } from '@catalog/dto/create-subscription-plan.dto';
import { StripeProduct } from '@stripe/entities/stripe-product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '@catalog/entities/subscription-plan.entity';
import { SubscriptionPlanPrice } from '@catalog/entities/subscription-plan-price.entity';
import { StripePrice } from '@stripe/entities/stripe-price.entity';
import { CreateSubscriptionPlanPriceDto } from '@catalog/dto/create-subscription-plan-price.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlansRepository: Repository<SubscriptionPlan>,

    @InjectRepository(SubscriptionPlanPrice)
    private readonly subscriptionPlanPricesRepository: Repository<SubscriptionPlanPrice>,

    @InjectRepository(StripeProduct)
    private readonly stripeProductsRepository: Repository<StripeProduct>,

    @InjectRepository(StripePrice)
    private readonly stripePricesRepository: Repository<StripePrice>,
  ) {}
  
  async createSubscriptionPlan(dto: CreateSubscriptionPlanDto) {
    let stripeProduct: StripeProduct | null = null;

    if (dto.stripeProductId) {
      stripeProduct = await this.stripeProductsRepository.findOne({
        where: {
          id: dto.stripeProductId,
        },
      });

      if (!stripeProduct) {
        throw new NotFoundException('Stripe product not found');
      }
    }

    const plan = this.subscriptionPlansRepository.create({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      kind: dto.kind,
      sortOrder: dto.sortOrder ?? 0,
      active: true,
      stripeProduct: stripeProduct ?? undefined,
    });

    return this.subscriptionPlansRepository.save(plan);
  }

  async createSubscriptionPlanPrice(dto: CreateSubscriptionPlanPriceDto) {
    const plan = await this.subscriptionPlansRepository.findOne({
      where: {
        id: dto.planId,
      },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const stripePrice = await this.stripePricesRepository.findOne({
      where: {
        id: dto.stripePriceId,
      },
    });

    if (!stripePrice) {
      throw new NotFoundException('Stripe price not found');
    }

    const planPrice = this.subscriptionPlanPricesRepository.create({
      label: dto.label,
      billingInterval: dto.billingInterval ?? stripePrice.interval,

      isDefault: dto.isDefault ?? false,

      sortOrder: dto.sortOrder ?? 0,

      active: true,

      plan,
      stripePrice,
    });

    return this.subscriptionPlanPricesRepository.save(planPrice);
  }
}
