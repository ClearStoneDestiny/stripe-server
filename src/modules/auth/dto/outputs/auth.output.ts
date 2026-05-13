import { Column } from 'typeorm';

@ObjectType()
export class AuthModel {
  @Column(() => String, { nullable: true })
  email?: string;

  @Column(() => String, { nullable: true })
  message?: string;

  @Column({ nullable: true })
  accessToken?: string;

  @Column({ nullable: true })
  refreshToken?: string;
}
