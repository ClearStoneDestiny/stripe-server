import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base-entity.entity';
import { SubscriptionPlan } from '@catalog/entities/subscription-plan.entity';
import { SurpriseCollectionGame } from '@catalog/entities/surprise-collection-game.entity';

@Entity('surprise_game_collections')
export class SurpriseGameCollection extends BaseEntity {
  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'period_start', type: 'date' })
  periodStart: string;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd: string;

  @Column({ default: true })
  active: boolean;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.surpriseCollections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @RelationId((collection: SurpriseGameCollection) => collection.plan)
  planId: number;

  @OneToMany(
    () => SurpriseCollectionGame,
    (collectionGame) => collectionGame.collection,
    {
      cascade: true,
    },
  )
  games: SurpriseCollectionGame[];
}
