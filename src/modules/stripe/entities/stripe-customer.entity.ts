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
import { StripeSubscription } from '@stripe/entities/stripe-subscription.entity';
import { StripePayment } from '@stripe/entities/stripe-payment.entity';

/**
 * Stripe customer IDs, relation with users
 */
@Entity('stripe_customers')
export class StripeCustomer extends BaseEntity {
  @Column({ name: 'stripe_customer_id', unique: true })
  stripeCustomerId: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ default: false })
  livemode: boolean;

  @ManyToOne(() => User, (user) => user.stripeCustomers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @RelationId((customer: StripeCustomer) => customer.user)
  userId: number;

  @OneToMany(() => StripeSubscription, (subscription) => subscription.customer)
  subscriptions: StripeSubscription[];

  @OneToMany(() => StripePayment, (payment) => payment.customer)
  payments: StripePayment[];
}
