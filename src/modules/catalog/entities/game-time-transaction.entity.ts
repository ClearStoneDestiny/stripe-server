import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@common/entities/base-entity.entity';
import { User } from '@user/entities/user.entity';
import { StripePayment } from '@stripe/entities/stripe-payment.entity';
import { GameTimeTransactionTypeEnum } from '@catalog/enums/game-time-transaction-type.enum';

@Entity('game_time_transactions')
export class GameTimeTransaction extends BaseEntity {
  @Column({ type: 'enum', enum: GameTimeTransactionTypeEnum })
  type: GameTimeTransactionTypeEnum;

  @Column({ type: 'int' })
  minutes: number;

  @Column({ nullable: true })
  reason?: string;

  @Column({ name: 'idempotency_key', unique: true, nullable: true })
  idempotencyKey?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (user) => user.gameTimeTransactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'source_payment_id', nullable: true })
  sourcePaymentId?: number;

  @ManyToOne(() => StripePayment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'source_payment_id' })
  sourcePayment?: StripePayment;
}
