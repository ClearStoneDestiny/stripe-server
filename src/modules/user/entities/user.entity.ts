import { Entity, Column, OneToMany } from 'typeorm';
import { RefreshToken } from '@auth/entities/refresh-token.entity';
import { UserRolesEnum } from '@user/enums/user-roles.enum';
import { BaseEntity } from '@common/entities/base-entity.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'enum', enum: UserRolesEnum, default: UserRolesEnum.USER })
  role: UserRolesEnum;

  @OneToMany(() => RefreshToken, (token) => token.user, { cascade: true })
  refreshTokens: RefreshToken[];
}
