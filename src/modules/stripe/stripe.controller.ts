import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { StripeService } from '@stripe/stripe.service';
import { CreateStripeProductInput } from '@stripe/dto/create-stripe-product.input';
import { CreateStripePriceInput } from '@stripe/dto/create-stripe-price.input';
import type { Response } from 'express';
import { AuthWithRoles } from '@auth/decorators/auth-with-roles.decorator';
import { UserRolesEnum } from '@user/enums/user-roles.enum';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @AuthWithRoles(UserRolesEnum.ADMIN)
  @Post('products')
  async createProduct(
    @Body() dto: CreateStripeProductInput,
    @Res() res: Response,
  ) {
    await this.stripeService.createProduct(dto);
    return res.status(HttpStatus.OK).json({
      message: 'Product created',
    });
  }

  @AuthWithRoles(UserRolesEnum.ADMIN)
  @Post('prices')
  async createPrice(@Body() dto: CreateStripePriceInput, @Res() res: Response) {
    await this.stripeService.createPrice(dto);
    return res.status(HttpStatus.OK).json({
      message: 'Price created',
    });
  }
}
