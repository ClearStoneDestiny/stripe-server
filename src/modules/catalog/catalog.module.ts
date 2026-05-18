import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from '@catalog/entities/game.entity';
import { SubscriptionPlan } from '@catalog/entities/subscription-plan.entity';
import { SubscriptionPlanPrice } from '@catalog/entities/subscription-plan-price.entity';
import { SurpriseGameCollection } from '@catalog/entities/surprise-game-collection.entity';
import { SurpriseCollectionGame } from '@catalog/entities/surprise-collection-game.entity';
import { HourPack } from '@catalog/entities/hour-pack.entity';
import { GameTimeBalance } from '@catalog/entities/game-time-balance.entity';
import { GameTimeTransaction } from '@catalog/entities/game-time-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Game,
      SubscriptionPlan,
      SubscriptionPlanPrice,
      SurpriseGameCollection,
      SurpriseCollectionGame,
      HourPack,
      GameTimeBalance,
      GameTimeTransaction,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class CatalogModule {}
