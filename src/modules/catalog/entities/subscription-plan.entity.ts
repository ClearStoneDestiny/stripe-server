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
import { StripeSubscription } from '@stripe/entities/stripe-subscription.entity';
import { SubscriptionPlanCodeEnum } from '@catalog/enums/subscription-plan-code.enum';
import { SubscriptionPlanKindEnum } from '@catalog/enums/subscription-plan-kind.enum';
import { SubscriptionPlanPrice } from '@catalog/entities/subscription-plan-price.entity';
import { Game } from '@catalog/entities/game.entity';
import { SurpriseGameCollection } from '@catalog/entities/surprise-game-collection.entity';

@Entity('subscription_plans')
export class SubscriptionPlan extends BaseEntity {
  @Column({ type: 'enum', enum: SubscriptionPlanCodeEnum, unique: true })
  code: SubscriptionPlanCodeEnum;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: SubscriptionPlanKindEnum })
  kind: SubscriptionPlanKindEnum;

  // Priority level of plan
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ManyToOne(() => StripeProduct, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'stripe_product_ref_id' })
  stripeProduct?: StripeProduct;

  @RelationId((plan: SubscriptionPlan) => plan.stripeProduct)
  stripeProductId?: number;

  @OneToMany(() => SubscriptionPlanPrice, (price) => price.plan)
  prices: SubscriptionPlanPrice[];

  @OneToMany(() => Game, (game) => game.requiredPlan)
  games: Game[];

  @OneToMany(() => SurpriseGameCollection, (collection) => collection.plan)
  surpriseCollections: SurpriseGameCollection[];

  @OneToMany(() => StripeSubscription, (subscription) => subscription.plan)
  stripeSubscriptions: StripeSubscription[];
}
