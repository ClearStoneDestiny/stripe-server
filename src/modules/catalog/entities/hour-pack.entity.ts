import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { BaseEntity } from '@common/entities/base-entity.entity';
import { StripeProduct } from '@stripe/entities/stripe-product.entity';
import { StripePrice } from '@stripe/entities/stripe-price.entity';

@Entity('hour_packs')
export class HourPack extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes: number;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ManyToOne(() => StripeProduct, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'stripe_product_ref_id' })
  stripeProduct?: StripeProduct;

  @RelationId((hourPack: HourPack) => hourPack.stripeProduct)
  stripeProductId?: number;

  @ManyToOne(() => StripePrice, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'stripe_price_ref_id' })
  stripePrice: StripePrice;

  @RelationId((hourPack: HourPack) => hourPack.stripePrice)
  stripePriceId: number;
}
