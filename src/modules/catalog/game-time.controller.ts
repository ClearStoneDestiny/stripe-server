import { Body, Controller, Get, HttpStatus, Post, Res } from '@nestjs/common';
import { UserRolesEnum } from '@user/enums/user-roles.enum';
import { AuthWithRoles } from '@auth/decorators/auth-with-roles.decorator';
import { CurrentUser } from '@auth/decorators/current-user.decorator';
import { User } from '@user/entities/user.entity';
import { GameTimeBalanceResponse } from '@catalog/responses/game-time-balance.response';
import { GameTimeTransaction } from '@catalog/entities/game-time-transaction.entity';
import type { Response } from 'express';
import { AdminAdjustDto } from '@catalog/dto/admin-adjust.dto';
import { GameTimeService } from '@catalog/game-time.service';

@Controller('game-time')
export class GameTimeController {
  constructor(private readonly gameTimeService: GameTimeService) {}

  // Current user balance
  @AuthWithRoles(UserRolesEnum.USER, UserRolesEnum.ADMIN)
  @Get('balance')
  async getBalance(
    @CurrentUser() user: User,
  ): Promise<GameTimeBalanceResponse> {
    return this.gameTimeService.getBalance(user.id);
  }

  // History of transactions
  @AuthWithRoles(UserRolesEnum.USER, UserRolesEnum.ADMIN)
  @Get('transactions')
  async getTransactions(
    @CurrentUser() user: User,
  ): Promise<GameTimeTransaction[]> {
    return this.gameTimeService.getTransactions(user.id);
  }

  // Only for debug / demo - manual write-off
  @AuthWithRoles(UserRolesEnum.ADMIN)
  @Post('admin/adjust')
  async adminAdjust(@Body() dto: AdminAdjustDto, @Res() res: Response) {
    await this.gameTimeService.adminAdjust(dto);
    return res.status(HttpStatus.OK).json({ message: 'Balance adjusted' });
  }
}
