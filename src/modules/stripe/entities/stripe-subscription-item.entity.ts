import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@common/entities/base-entity.entity';
import { StripeSubscription } from '@stripe/entities/stripe-subscription.entity';
import { StripePrice } from '@stripe/entities/stripe-price.entity';
/**
 * Items inside subscription,
 * to support multiple prices in one subscription
 */
@Entity('stripe_subscription_items')
export class StripeSubscriptionItem extends BaseEntity {
  @Column({ name: 'stripe_subscription_item_id', unique: true })
  stripeSubscriptionItemId: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'subscription_id' })
  subscriptionId: number;

  @ManyToOne(() => StripeSubscription, (subscription) => subscription.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subscription_id' })
  subscription: StripeSubscription;

  @Column({ name: 'price_id' })
  priceId: number;

  @ManyToOne(() => StripePrice, (price) => price.subscriptionItems, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'price_id' })
  price: StripePrice;
}
