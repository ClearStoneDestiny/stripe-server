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
import { GetGamesResponseDto } from '@catalog/dto/get-games-response.dto';
import { SurpriseCollectionResponseDto } from '@catalog/responses/surprise-collection.response';

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

  @Get('surprise/current')
  getCurrentSurpriseCollection(): Promise<SurpriseCollectionResponseDto> {
    return this.catalogService.getCurrentSurpriseCollection();
  }
}
