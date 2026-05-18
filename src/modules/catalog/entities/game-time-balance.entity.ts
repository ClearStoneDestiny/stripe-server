import { Column, Entity, JoinColumn, OneToOne, RelationId } from 'typeorm';
import { BaseEntity } from '@common/entities/base-entity.entity';
import { User } from '@user/entities/user.entity';

@Entity('game_time_balances')
export class GameTimeBalance extends BaseEntity {
  @Column({ name: 'available_minutes', type: 'int', default: 0 })
  availableMinutes: number;

  @OneToOne(() => User, (user) => user.gameTimeBalance, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @RelationId((balance: GameTimeBalance) => balance.user)
  userId: number;
}
