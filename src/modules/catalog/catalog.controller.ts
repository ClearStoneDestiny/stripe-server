import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { CatalogService } from '@catalog/catalog.service';
import { type Response } from 'express';
import { CreateSubscriptionPlanDto } from '@catalog/dto/create-subscription-plan.dto';
import { CreateSubscriptionPlanPriceDto } from '@catalog/dto/create-subscription-plan-price.dto';
import { AuthWithRoles } from '@auth/decorators/auth-with-roles.decorator';
import { UserRolesEnum } from '@user/enums/user-roles.enum';
import { CreateGameDto } from '@catalog/dto/create-game.dto';
import { UpdateGamePlanDto } from '@catalog/dto/update-game-plan.dto';
import { GetGamesDto } from '@catalog/dto/get-games.dto';
import { GetGamesResponseDto } from '@/modules/catalog/responses/get-games.response';
import { SurpriseCollectionResponseDto } from '@catalog/responses/surprise-collection.response';
import { CreateHourPackDto } from '@catalog/dto/create-hour-pack.dto';
import { GetHourPacksDto } from '@catalog/dto/get-hour-packs.dto';
import { HourPackResponse } from '@catalog/responses/hour-pack.response';
import { GetSubscriptionPlansDto } from '@catalog/dto/get-subscription-plans.dto';
import { SubscriptionPlanResponse } from '@catalog/responses/subscription-plan.response';

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

  @AuthWithRoles(UserRolesEnum.ADMIN, UserRolesEnum.USER)
  @Get('subscription-plans')
  async getSubscriptionPlans(
    @Query() query: GetSubscriptionPlansDto,
  ): Promise<SubscriptionPlanResponse[]> {
    return this.catalogService.getSubscriptionPlans(query);
  }

  @AuthWithRoles(UserRolesEnum.ADMIN)
  @Post('games')
  async createGame(@Body() dto: CreateGameDto, @Res() res: Response) {
    await this.catalogService.createGame(dto);
    return res.status(HttpStatus.OK).json({
      message: 'Game created',
      name: dto.title,
    });
  }

  @AuthWithRoles(UserRolesEnum.ADMIN)
  @Patch('games/:id/required-plan')
  async updateGameRequiredPlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGamePlanDto,
    @Res() res: Response,
  ) {
    await this.catalogService.updateGameRequiredPlan(id, dto);
    return res.status(HttpStatus.OK).json({
      message: 'Required plan for game updated',
    });
  }

  @AuthWithRoles(UserRolesEnum.ADMIN, UserRolesEnum.USER)
  @Get('games')
  async getGames(@Query() query: GetGamesDto): Promise<GetGamesResponseDto> {
    return this.catalogService.getGames(query);
  }

  @AuthWithRoles(UserRolesEnum.ADMIN, UserRolesEnum.USER)
  @Get('surprise/current')
  getCurrentSurpriseCollection(): Promise<SurpriseCollectionResponseDto> {
    return this.catalogService.getCurrentSurpriseCollection();
  }

  @AuthWithRoles(UserRolesEnum.ADMIN)
  @Post('hour-packs')
  async createHourPack(@Body() dto: CreateHourPackDto, @Res() res: Response) {
    await this.catalogService.createHourPack(dto);
    return res.status(HttpStatus.OK).json({
      message: 'Hour pack created',
      name: dto.name,
    });
  }

  @AuthWithRoles(UserRolesEnum.ADMIN)
  @Patch('hour-packs/:id/active')
  async toggleHourPackActive(
    @Param('id', ParseIntPipe) id: number,
    @Body('active') active: boolean,
    @Res() res: Response,
  ) {
    await this.catalogService.toggleHourPackActive(id, active);
    return res.status(HttpStatus.OK).json({ message: 'Hour pack updated' });
  }

  @AuthWithRoles(UserRolesEnum.ADMIN, UserRolesEnum.USER)
  @Get('hour-packs')
  async getHourPacks(
    @Query() query: GetHourPacksDto,
  ): Promise<HourPackResponse[]> {
    return this.catalogService.getHourPacks(query);
  }
}
