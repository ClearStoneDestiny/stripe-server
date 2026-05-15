import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '@common/entities/base-entity.entity';
import { StripePrice } from '@stripe/entities/stripe-price.entity';

/**
 * Local catalogue for stripe products
 */
@Entity('stripe_products')
export class StripeProduct extends BaseEntity {
  @Column({ name: 'stripe_product_id', unique: true })
  stripeProductId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  active: boolean;

  @Column({ default: false })
  livemode: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @OneToMany(() => StripePrice, (price) => price.product)
  prices: StripePrice[];
}
