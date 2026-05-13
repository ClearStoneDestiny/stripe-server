import { UserRolesEnum } from '../../enums/user-roles.enum';

export class UserOutput {
  id: number;

  email: string;

  role: UserRolesEnum;

  createdAt: Date;
}
