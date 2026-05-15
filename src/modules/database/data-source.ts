import { DataSource } from 'typeorm';
import { User } from '@user/entities/user.entity';
import { RefreshToken } from '@auth/entities/refresh-token.entity';
import * as dotenv from 'dotenv';
import { StripeCustomer } from '@stripe/entities/stripe-customer.entity';
import { StripePayment } from '@stripe/entities/stripe-payment.entity';
import { StripePrice } from '@stripe/entities/stripe-price.entity';
import { StripeProduct } from '@stripe/entities/stripe-product.entity';
import { StripeSubscription } from '@stripe/entities/stripe-subscription.entity';
import { StripeSubscriptionItem } from '@stripe/entities/stripe-subscription-item.entity';
import { StripeWebhookEvent } from '@stripe/entities/stripe-webhook-event.entity';

dotenv.config();

/**
 * For migrations only
 */
export const AppDataSource = new DataSource({
  type: process.env.DB_TYPE as any,
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_NAME,
  entities: [
    User,
    RefreshToken,
    StripeCustomer,
    StripePayment,
    StripePrice,
    StripeProduct,
    StripeSubscription,
    StripeSubscriptionItem,
    StripeWebhookEvent,
  ],
  migrations: ['src/modules/databases/migrations/*.ts'],
  synchronize: true,
});
