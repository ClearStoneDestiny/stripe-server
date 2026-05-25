import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  RelationId,
  Unique,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base-entity.entity';
import { Game } from '@catalog/entities/game.entity';
import { SurpriseGameCollection } from '@catalog/entities/surprise-game-collection.entity';

@Entity('surprise_collection_games')
@Unique(['collection', 'game'])
export class SurpriseCollectionGame extends BaseEntity {
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => SurpriseGameCollection, (collection) => collection.games, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'collection_id' })
  collection: SurpriseGameCollection;

  @RelationId(
    (collectionGame: SurpriseCollectionGame) => collectionGame.collection,
  )
  collectionId: number;

  @ManyToOne(() => Game, (game) => game.surpriseCollectionGames, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @RelationId((collectionGame: SurpriseCollectionGame) => collectionGame.game)
  gameId: number;
}
