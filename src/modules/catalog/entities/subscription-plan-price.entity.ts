import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { BaseEntity } from '@common/entities/base-entity.entity';
import { StripePrice } from '@stripe/entities/stripe-price.entity';
import { StripePriceIntervalEnum } from '@stripe/enums/stripe-price-interval.enum';
import { SubscriptionPlan } from '@catalog/entities/subscription-plan.entity';

@Entity('subscription_plan_prices')
export class SubscriptionPlanPrice extends BaseEntity {
  @Column({ nullable: true })
  label?: string;

  @Column({
    name: 'billing_interval',
    type: 'enum',
    enum: StripePriceIntervalEnum,
    nullable: true,
  })
  billingInterval?: StripePriceIntervalEnum;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  active: boolean;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.prices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @RelationId((planPrice: SubscriptionPlanPrice) => planPrice.plan)
  planId: number;

  @ManyToOne(() => StripePrice, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'stripe_price_ref_id' })
  stripePrice: StripePrice;

  @RelationId((planPrice: SubscriptionPlanPrice) => planPrice.stripePrice)
  stripePriceId: number;
}
