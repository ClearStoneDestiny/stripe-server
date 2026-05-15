import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base-entity.entity';
import { StripeProduct } from '@stripe/entities/stripe-product.entity';
import { StripePriceTypeEnum } from '@stripe/enums/stripe-price-type.enum';
import { StripePriceIntervalEnum } from '@stripe/enums/stripe-price-interval.enum';
import { StripeSubscription } from '@stripe/entities/stripe-subscription.entity';
import { StripeSubscriptionItem } from '@stripe/entities/stripe-subscription-item.entity';
import { StripePayment } from '@stripe/entities/stripe-payment.entity';

/**
 * Stripe prices for one-time and recurring tariffs
 */
@Entity('stripe_prices')
export class StripePrice extends BaseEntity {
  @Column({ name: 'stripe_price_id', unique: true })
  stripePriceId: string;

  @Column({ type: 'enum', enum: StripePriceTypeEnum })
  type: StripePriceTypeEnum;

  @Column()
  currency: string;

  @Column({ name: 'unit_amount', type: 'int' })
  unitAmount: number;

  @Column({ type: 'enum', enum: StripePriceIntervalEnum, nullable: true })
  interval?: StripePriceIntervalEnum;

  @Column({ name: 'interval_count', type: 'int', nullable: true })
  intervalCount?: number;

  @Column({ name: 'lookup_key', nullable: true })
  lookupKey?: string;

  @Column({ default: true })
  active: boolean;

  @Column({ default: false })
  livemode: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ManyToOne(() => StripeProduct, (product) => product.prices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: StripeProduct;

  @RelationId((price: StripePrice) => price.product)
  productId: number;

  @OneToMany(() => StripeSubscription, (subscription) => subscription.price)
  subscriptions: StripeSubscription[];

  @OneToMany(() => StripeSubscriptionItem, (item) => item.price)
  subscriptionItems: StripeSubscriptionItem[];

  @OneToMany(() => StripePayment, (payment) => payment.price)
  payments: StripePayment[];
}
