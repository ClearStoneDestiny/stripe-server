import { UserRolesEnum } from '@user/enums/user-roles.enum';

export interface ITokenPayload {
  id: number;
  email: string;
  role: UserRolesEnum;
}
