import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripeClient: ReturnType<typeof Stripe>;

  constructor(private readonly configService: ConfigService) {
    this.stripeClient = new Stripe(
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
    );
  }

  get client(): ReturnType<typeof Stripe> {
    return this.stripeClient;
  }
}
