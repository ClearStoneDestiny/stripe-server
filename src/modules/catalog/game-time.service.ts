import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameTimeBalance } from '@catalog/entities/game-time-balance.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { GameTimeTransaction } from '@catalog/entities/game-time-transaction.entity';
import { HourPack } from '@catalog/entities/hour-pack.entity';
import { StripePayment } from '@stripe/entities/stripe-payment.entity';
import { GameTimeBalanceResponse } from '@catalog/responses/game-time-balance.response';
import { GameTimeTransactionTypeEnum } from '@catalog/enums/game-time-transaction-type.enum';
import { AdminAdjustDto } from '@catalog/dto/admin-adjust.dto';
import { GameTimeTransactionResponse } from '@catalog/responses/game-time-transaction.response';

@Injectable()
export class GameTimeService {
  constructor(
    @InjectRepository(GameTimeBalance)
    private readonly balanceRepository: Repository<GameTimeBalance>,

    @InjectRepository(GameTimeTransaction)
    private readonly transactionRepository: Repository<GameTimeTransaction>,

    @InjectRepository(HourPack)
    private readonly hourPackRepository: Repository<HourPack>,

    @InjectRepository(StripePayment)
    private readonly stripePaymentRepository: Repository<StripePayment>,

    private readonly dataSource: DataSource,
  ) {}

  async getBalance(userId: number): Promise<GameTimeBalanceResponse> {
    const balance = await this.ensureCurrentMonthBalance(userId);
    const availableMinutes = balance.availableMinutes;
    const usedMinutes = balance.usedMinutes;
    const totalMinutes = availableMinutes + usedMinutes;

    return {
      availableMinutes,
      availableHours: Math.round((availableMinutes / 60) * 10) / 10,
      usedMinutes,
      usedHours: Math.round((usedMinutes / 60) * 10) / 10,
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      currentMonth: this.getCurrentMonthKey(),
      nextResetAt: this.getNextResetDate(),
    };
  }

  async getOrCreateBalance(
    userId: number,
    em?: EntityManager,
  ): Promise<GameTimeBalance> {
    const repo = em
      ? em.getRepository(GameTimeBalance)
      : this.balanceRepository;

    let balance = await repo.findOne({
      where: { userId },
      lock: em ? { mode: 'pessimistic_write' } : undefined,
    });

    if (!balance) {
      balance = repo.create({
        userId,
        availableMinutes: 0,
        usedMinutes: 0,
        lastResetMonth: this.getCurrentMonthKey(),
      });
      await repo.save(balance);
    }

    return balance;
  }

  async creditFromPayment(
    userId: number,
    hourPackCode: string,
    stripePaymentIntentId: string,
  ): Promise<void> {
    const hourPack = await this.hourPackRepository.findOne({
      where: { code: hourPackCode },
    });

    if (!hourPack) {
      throw new NotFoundException('Hour pack not found');
    }

    const stripePayment = await this.stripePaymentRepository.findOne({
      where: { stripePaymentIntentId },
    });

    await this.dataSource.transaction(async (em) => {
      const existing = await em.findOne(GameTimeTransaction, {
        where: { idempotencyKey: stripePaymentIntentId },
      });

      if (existing) {
        return;
      }

      const balance = await this.ensureCurrentMonthBalance(userId, em);

      await em.update(
        GameTimeBalance,
        { userId },
        {
          availableMinutes: balance.availableMinutes + hourPack.durationMinutes,
        },
      );

      const transaction = em.create(GameTimeTransaction, {
        type: GameTimeTransactionTypeEnum.PURCHASE,
        minutes: hourPack.durationMinutes,
        userId,
        idempotencyKey: stripePaymentIntentId,
        sourcePaymentId: stripePayment?.id,
        reason: `Hour pack purchase: ${hourPack.code}`,
        metadata: {
          hourPackCode: hourPack.code,
          hourPackName: hourPack.name,
        },
      });
      await em.save(transaction);
    });
  }

  async adminAdjust(dto: AdminAdjustDto): Promise<void> {
    await this.dataSource.transaction(async (em) => {
      const balance = await this.ensureCurrentMonthBalance(dto.userId, em);

      const newMinutes = balance.availableMinutes + dto.minutes;

      if (newMinutes < 0) {
        throw new BadRequestException('Balance cannot go below zero');
      }

      await em.update(
        GameTimeBalance,
        { userId: dto.userId },
        { availableMinutes: newMinutes },
      );

      await em.save(
        em.create(GameTimeTransaction, {
          type: GameTimeTransactionTypeEnum.ADJUSTMENT,
          minutes: dto.minutes,
          userId: dto.userId,
          reason: dto.reason ?? 'Admin adjustment',
          idempotencyKey: `admin_adjust_${dto.userId}_${Date.now()}`,
        }),
      );
    });
  }

  private async ensureCurrentMonthBalance(
    userId: number,
    em?: EntityManager,
  ): Promise<GameTimeBalance> {
    if (em) {
      return this.ensureCurrentMonthBalanceInTransaction(userId, em);
    }

    return this.dataSource.transaction((em) =>
      this.ensureCurrentMonthBalanceInTransaction(userId, em),
    );
  }

  private async ensureCurrentMonthBalanceInTransaction(
    userId: number,
    em: EntityManager,
  ): Promise<GameTimeBalance> {
    const balance = await this.getOrCreateBalance(userId, em);
    const currentMonth = this.getCurrentMonthKey();

    if (balance.lastResetMonth === currentMonth) {
      return balance;
    }

    const resetMinutes = balance.availableMinutes;
    const resetKey = `monthly_reset_${userId}_${currentMonth}`;

    await em.update(
      GameTimeBalance,
      { userId },
      {
        availableMinutes: 0,
        usedMinutes: 0,
        lastResetMonth: currentMonth,
      },
    );

    if (resetMinutes > 0) {
      await em.save(
        em.create(GameTimeTransaction, {
          type: GameTimeTransactionTypeEnum.ADJUSTMENT,
          minutes: -resetMinutes,
          userId,
          reason: 'Monthly balance reset',
          idempotencyKey: resetKey,
          metadata: {
            resetMonth: currentMonth,
            resetDate: new Date().toISOString(),
          },
        }),
      );
    }

    return {
      ...balance,
      availableMinutes: 0,
      usedMinutes: 0,
      lastResetMonth: currentMonth,
    };
  }

  private getNextResetDate(): Date {
    const now = new Date();
    // The first day of the next month at 00:00 UTC
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  }

  private getCurrentMonthKey(): string {
    const now = new Date();
    // For example, "2025-01" is a unique key for reset idempotency
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  async getTransactions(
    userId: number,
  ): Promise<GameTimeTransactionResponse[]> {
    const transactions = await this.transactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return transactions.map((transaction) =>
      this.mapTransactionToResponse(transaction),
    );
  }

  private mapTransactionToResponse(
    transaction: GameTimeTransaction,
  ): GameTimeTransactionResponse {
    return {
      id: transaction.id,
      type: transaction.type,
      minutes: transaction.minutes,
      hours: Math.round((transaction.minutes / 60) * 10) / 10,
      reason: transaction.reason,
      createdAt: transaction.createdAt,
    };
  }
}
