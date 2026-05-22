import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { type Response} from 'express';
import { CreateSubscriptionPlanDto } from '@catalog/dto/create-subscription-plan.dto';
import { CreateSubscriptionPlanPriceDto } from '@catalog/dto/create-subscription-plan-price.dto';
import { AuthWithRoles } from '@auth/decorators/auth-with-roles.decorator';
import { UserRolesEnum } from '@user/enums/user-roles.enum';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @AuthWithRoles(UserRolesEnum.ADMIN)
  @Post('subscription-plans')
  async createSubscriptionPlan(
    @Body() dto: CreateSubscriptionPlanDto,
    @Res() res: Response,
  ) {
    await this.catalogService.createSubscriptionPlan(dto);
    return res.status(HttpStatus.OK).json({
      message: 'Subscription plan created',
      name: dto.name,
    });
  }
  
  @AuthWithRoles(UserRolesEnum.ADMIN)
  @Post('subscription-plan-prices')
  async createSubscriptionPlanPrice(
    @Body() dto: CreateSubscriptionPlanPriceDto,
    @Res() res: Response,
  ) {
    await this.catalogService.createSubscriptionPlanPrice(dto);
    return res.status(HttpStatus.OK).json({
      message: 'Subscription price created',
    });
  }
}
