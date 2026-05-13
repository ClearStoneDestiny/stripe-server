import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserRolesEnum } from '../../enums/user-roles.enum';

@ObjectType()
export class UserOutput {
  @Field(() => ID)
  id: number;

  @Field()
  email: string;

  @Field(() => UserRolesEnum)
  role: UserRolesEnum;

  @Field()
  createdAt: Date;
}
