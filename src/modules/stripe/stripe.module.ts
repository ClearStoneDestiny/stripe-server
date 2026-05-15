import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@user/entities/user.entity';
import { StripeCustomer } from '@stripe/entities/stripe-customer.entity';
import { StripeProduct } from '@stripe/entities/stripe-product.entity';
import { StripePrice } from '@stripe/entities/stripe-price.entity';
import { StripeSubscription } from '@stripe/entities/stripe-subscription.entity';
import { StripeSubscriptionItem } from '@stripe/entities/stripe-subscription-item.entity';
import { StripePayment } from '@stripe/entities/stripe-payment.entity';
import { StripeWebhookEvent } from '@stripe/entities/stripe-webhook-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      StripeCustomer,
      StripeProduct,
      StripePrice,
      StripeSubscription,
      StripeSubscriptionItem,
      StripePayment,
      StripeWebhookEvent,
    ]),
  ],
  providers: [StripeService],
  controllers: [StripeController],
  exports: [StripeService],
})
export class StripeModule {}
