import { Module } from '@nestjs/common';
import { StripeService } from '@stripe/stripe.service';
import { StripeController } from '@stripe/stripe.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@user/entities/user.entity';
import { StripeCustomer } from '@stripe/entities/stripe-customer.entity';
import { StripeProduct } from '@stripe/entities/stripe-product.entity';
import { StripePrice } from '@stripe/entities/stripe-price.entity';
import { StripeSubscription } from '@stripe/entities/stripe-subscription.entity';
import { StripeSubscriptionItem } from '@stripe/entities/stripe-subscription-item.entity';
import { StripePayment } from '@stripe/entities/stripe-payment.entity';
import { StripeWebhookEvent } from '@stripe/entities/stripe-webhook-event.entity';
import { AuthModule } from '@auth/auth.module';
import { StripeWebhookService } from '@stripe/stripe-webhook.service';
import { StripeWebhookController } from '@stripe/stripe-webhook.controller';
import { SubscriptionWebhookHandler } from '@stripe/handlers/subscription-webhook.handler';
import { PaymentWebhookHandler } from '@stripe/handlers/payment-webhook.handler';

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
    AuthModule,
  ],
  providers: [
    StripeService,
    StripeWebhookService,
    SubscriptionWebhookHandler,
    PaymentWebhookHandler,
  ],
  controllers: [StripeController, StripeWebhookController],
  exports: [StripeService, TypeOrmModule],
})
export class StripeModule {}
