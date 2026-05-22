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
import { CatalogService } from '@catalog/catalog.service';
import { CatalogController } from '@catalog/catalog.controller';
import { StripeService } from '@stripe/stripe.service';
import { StripeModule } from '@stripe/stripe.module';
import { AuthModule } from '@auth/auth.module';
import { GameTimeController } from '@catalog/game-time.controller';
import { GameTimeService } from '@catalog/game-time.service';

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
    StripeModule,
    AuthModule,
  ],
  controllers: [CatalogController, GameTimeController],
  providers: [CatalogService, StripeService, GameTimeService],
  exports: [TypeOrmModule, CatalogService],
})
export class CatalogModule {}
