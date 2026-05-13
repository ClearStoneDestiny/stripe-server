import { Column, Entity, ManyToOne } from 'typeorm';
import { User } from '@user/entities/user.entity';
import { BaseEntity } from '@common/entities/base-entity.entity';

@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @Column()
  token: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  user: User;
}
