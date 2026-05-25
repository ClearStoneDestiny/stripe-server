import {
  BadRequestException,
  Controller,
  Headers,
  HttpStatus,
  Post,
  type RawBodyRequest,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { StripeWebhookService } from '@stripe/stripe-webhook.service';

@Controller('stripe')
export class StripeWebhookController {
  constructor(private readonly stripeWebhookService: StripeWebhookService) {}

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
    @Res() res: Response,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    await this.stripeWebhookService.handleWebhook(req.rawBody, signature);
    return res.status(HttpStatus.OK).json({ received: true });
  }
}
