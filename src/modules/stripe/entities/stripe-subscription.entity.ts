import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base-entity.entity';
import { User } from '@user/entities/user.entity';
import { StripeCustomer } from '@stripe/entities/stripe-customer.entity';
import { StripePrice } from '@stripe/entities/stripe-price.entity';
import { StripeSubscriptionStatusEnum } from '@stripe/enums/stripe-subscription-status.enum';
import { StripeSubscriptionItem } from '@stripe/entities/stripe-subscription-item.entity';
import { SubscriptionPlan } from '@catalog/entities/subscription-plan.entity';

/**
 * Subscription of specific users
 */
@Entity('stripe_subscriptions')
export class StripeSubscription extends BaseEntity {
  @Column({ name: 'stripe_subscription_id', unique: true })
  stripeSubscriptionId: string;

  @Column({ type: 'enum', enum: StripeSubscriptionStatusEnum })
  status: StripeSubscriptionStatusEnum;

  @Column({
    name: 'current_period_start',
    type: 'timestamp with time zone',
    nullable: true,
  })
  currentPeriodStart?: Date;

  @Column({
    name: 'current_period_end',
    type: 'timestamp with time zone',
    nullable: true,
  })
  currentPeriodEnd?: Date;

  @Column({ name: 'cancel_at_period_end', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({
    name: 'canceled_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  canceledAt?: Date;

  @Column({
    name: 'trial_end',
    type: 'timestamp with time zone',
    nullable: true,
  })
  trialEnd?: Date;

  @Column({ default: false })
  livemode: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ManyToOne(() => User, (user) => user.stripeSubscriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @RelationId((subscription: StripeSubscription) => subscription.user)
  userId: number;

  @ManyToOne(() => StripeCustomer, (customer) => customer.subscriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: StripeCustomer;

  @RelationId((subscription: StripeSubscription) => subscription.customer)
  customerId: number;

  @ManyToOne(() => StripePrice, (price) => price.subscriptions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'price_id' })
  price?: StripePrice;

  @RelationId((subscription: StripeSubscription) => subscription.price)
  priceId?: number;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.stripeSubscriptions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'plan_id' })
  plan?: SubscriptionPlan;

  @RelationId((subscription: StripeSubscription) => subscription.plan)
  planId?: number;

  @OneToMany(() => StripeSubscriptionItem, (item) => item.subscription, {
    cascade: true,
  })
  items: StripeSubscriptionItem[];
}
