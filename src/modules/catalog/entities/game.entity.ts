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

@Entity('games')
export class Game extends BaseEntity {
  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column({ name: 'short_description', nullable: true })
  shortDescription?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'cover_image_url', nullable: true })
  coverImageUrl?: string;

  @Column({ name: 'hero_image_url', nullable: true })
  heroImageUrl?: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.games, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'required_plan_id' })
  requiredPlan?: SubscriptionPlan;

  @RelationId((game: Game) => game.requiredPlan)
  requiredPlanId?: number;

  @OneToMany(
    () => SurpriseCollectionGame,
    (collectionGame) => collectionGame.game,
  )
  surpriseCollectionGames: SurpriseCollectionGame[];
}
