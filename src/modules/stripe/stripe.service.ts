import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { StripeProduct } from '@stripe/entities/stripe-product.entity';
import { StripePrice } from '@stripe/entities/stripe-price.entity';
import { Repository } from 'typeorm';
import { CreateStripeProductInput } from '@stripe/dto/create-stripe-product.input';
import { CreateStripePriceInput } from '@stripe/dto/create-stripe-price.input';
import { StripePriceTypeEnum } from '@stripe/enums/stripe-price-type.enum';
import { StripePriceIntervalEnum } from '@stripe/enums/stripe-price-interval.enum';
import { User } from '@user/entities/user.entity';
import { StripeCustomer } from '@stripe/entities/stripe-customer.entity';

@Injectable()
export class StripeService {
  private readonly stripeClient: ReturnType<typeof Stripe>;

  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(StripeProduct)
    private readonly stripeProductsRepository: Repository<StripeProduct>,

    @InjectRepository(StripePrice)
    private readonly stripePricesRepository: Repository<StripePrice>,

    @InjectRepository(StripeCustomer)
    private readonly stripeCustomerRepository: Repository<StripeCustomer>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    this.stripeClient = new Stripe(
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
      {
        apiVersion: '2026-04-22.preview',
      },
    );
  }

  get client(): ReturnType<typeof Stripe> {
    return this.stripeClient;
  }

  async createProduct(dto: CreateStripeProductInput) {
    const stripeProduct = await this.stripeClient.products.create({
      name: dto.name,
      description: dto.description,
    });

    const product = this.stripeProductsRepository.create({
      stripeProductId: stripeProduct.id,
      name: stripeProduct.name,
      description: stripeProduct.description ?? undefined,
      active: stripeProduct.active,
      livemode: stripeProduct.livemode,
      metadata: stripeProduct.metadata,
    });

    return this.stripeProductsRepository.save(product);
  }

  async createPrice(dto: CreateStripePriceInput) {
    const localProduct = await this.stripeProductsRepository.findOne({
      where: {
        stripeProductId: dto.productId,
      },
    });

    if (!localProduct) {
      throw new NotFoundException('Stripe product not found in local DB');
    }

    const stripePrice = await this.stripeClient.prices.create({
      product: localProduct.stripeProductId,
      currency: dto.currency,
      unit_amount: dto.unitAmount,

      recurring:
        dto.type === StripePriceTypeEnum.RECURRING
          ? {
              interval: dto.interval!,
              interval_count: dto.intervalCount ?? 1,
            }
          : undefined,

      lookup_key: dto.lookupKey,
    });

    const price = this.stripePricesRepository.create({
      stripePriceId: stripePrice.id,
      type: dto.type,
      currency: stripePrice.currency,
      unitAmount: stripePrice.unit_amount ?? 0,
      interval: stripePrice.recurring?.interval as StripePriceIntervalEnum,
      intervalCount: stripePrice.recurring?.interval_count,
      lookupKey: stripePrice.lookup_key ?? undefined,
      active: stripePrice.active,
      livemode: stripePrice.livemode,
      metadata: stripePrice.metadata,

      product: localProduct,
    });

    return this.stripePricesRepository.save(price);
  }

  async getOrCreateCustomer(user: Pick<User, 'id' | 'email'>) {
    const existingCustomer = await this.stripeCustomerRepository.findOne({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });

    if (existingCustomer) {
      return existingCustomer;
    }

    const customer = await this.stripeClient.customers.create({
      email: user.email,
      metadata: {
        userId: String(user.id),
      },
    });

    const localCustomer = this.stripeCustomerRepository.create({
      stripeCustomerId: customer.id,
      email: customer.email ?? user.email,
      name: customer.name ?? undefined,
      livemode: customer.livemode,
      userId: user.id,
    });

    return this.stripeCustomerRepository.save(localCustomer);
  }

  async syncCustomerByStripeId(
    stripeCustomerId: string,
    fallbackUserId?: number,
  ): Promise<StripeCustomer | null> {
    const existingCustomer = await this.stripeCustomerRepository.findOne({
      where: { stripeCustomerId },
    });

    if (existingCustomer) {
      return existingCustomer;
    }

    const stripeCustomer =
      await this.stripeClient.customers.retrieve(stripeCustomerId);

    if ('deleted' in stripeCustomer && stripeCustomer.deleted) {
      return null;
    }

    const userId =
      this.parseMetadataNumber(stripeCustomer.metadata?.userId) ??
      fallbackUserId;

    if (!userId) {
      return null;
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      return null;
    }

    const localCustomer = this.stripeCustomerRepository.create({
      stripeCustomerId: stripeCustomer.id,
      email: stripeCustomer.email ?? user.email,
      name: stripeCustomer.name ?? undefined,
      livemode: stripeCustomer.livemode,
      userId: user.id,
    });

    return this.stripeCustomerRepository.save(localCustomer);
  }

  private parseMetadataNumber(value: string | undefined): number | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
