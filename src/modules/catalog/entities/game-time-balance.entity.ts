import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '@common/entities/base-entity.entity';
import { User } from '@user/entities/user.entity';

@Entity('game_time_balances')
export class GameTimeBalance extends BaseEntity {
  @Column({ name: 'user_id', unique: true })
  userId: number;

  @Column({ name: 'available_minutes', type: 'int', default: 0 })
  availableMinutes: number;

  @Column({ name: 'used_minutes', type: 'int', default: 0 })
  usedMinutes: number;

  @Column({ name: 'last_reset_month', nullable: true })
  lastResetMonth?: string;

  @OneToOne(() => User, (user) => user.gameTimeBalance, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
