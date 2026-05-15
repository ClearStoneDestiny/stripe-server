import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { BaseEntity } from '@common/entities/base-entity.entity';
import { User } from '@user/entities/user.entity';
import { StripeCustomer } from '@stripe/entities/stripe-customer.entity';
import { StripePrice } from '@stripe/entities/stripe-price.entity';
import { StripePaymentFlowEnum } from '@stripe/enums/stripe-payment-flow.enum';

/**
 * One-time payments:
 * checkout
 * payment
 * links
 * invoices
 */
@Entity('stripe_payments')
export class StripePayment extends BaseEntity {
  @Column({ name: 'stripe_payment_intent_id', unique: true, nullable: true })
  stripePaymentIntentId?: string;

  @Column({ name: 'stripe_checkout_session_id', unique: true, nullable: true })
  stripeCheckoutSessionId?: string;

  @Column({ name: 'stripe_payment_link_id', nullable: true })
  stripePaymentLinkId?: string;

  @Column({ name: 'stripe_invoice_id', unique: true, nullable: true })
  stripeInvoiceId?: string;

  @Column({ type: 'enum', enum: StripePaymentFlowEnum })
  paymentFlow: StripePaymentFlowEnum;

  @Column()
  status: string;

  @Column({ type: 'int' })
  amount: number;

  @Column()
  currency: string;

  @Column({ default: false })
  livemode: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ManyToOne(() => User, (user) => user.stripePayments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @RelationId((payment: StripePayment) => payment.user)
  userId: number;

  @ManyToOne(() => StripeCustomer, (customer) => customer.payments, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'customer_id' })
  customer?: StripeCustomer;

  @RelationId((payment: StripePayment) => payment.customer)
  customerId?: number;

  @ManyToOne(() => StripePrice, (price) => price.payments, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'price_id' })
  price?: StripePrice;

  @RelationId((payment: StripePayment) => payment.price)
  priceId?: number;
}
