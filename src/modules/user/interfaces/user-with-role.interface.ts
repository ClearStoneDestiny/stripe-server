import { Response } from 'express';
import { UserRolesEnum } from '../enums/user-roles.enum';

export interface IUserWithRole {
  email: string;
  password: string;
  role: UserRolesEnum;
  username?: string;
  res?: Response;
}
