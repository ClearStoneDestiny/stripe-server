import { Entity, Column, OneToMany } from 'typeorm';
import { RefreshToken } from '@auth/entities/refresh-token.entity';
import { UserRolesEnum } from '@user/enums/user-roles.enum';
import { BaseEntity } from '@common/entities/base-entity.entity';
import { StripeCustomer } from '@stripe/entities/stripe-customer.entity';
import { StripeSubscription } from '@stripe/entities/stripe-subscription.entity';
import { StripePayment } from '@stripe/entities/stripe-payment.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'enum', enum: UserRolesEnum, default: UserRolesEnum.USER })
  role: UserRolesEnum;

  @OneToMany(() => RefreshToken, (token) => token.user, { cascade: true })
  refreshTokens: RefreshToken[];

  @OneToMany(() => StripeCustomer, (stripeCustomer) => stripeCustomer.user, {
    cascade: true,
  })
  stripeCustomers: StripeCustomer[];

  @OneToMany(() => StripeSubscription, (subscription) => subscription.user)
  stripeSubscriptions: StripeSubscription[];

  @OneToMany(() => StripePayment, (payment) => payment.user)
  stripePayments: StripePayment[];
}
