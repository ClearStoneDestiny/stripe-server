import { User } from '../../modules/user/entities/user.entity';

declare global {
  namespace Express {
    interface Request {
      user?: Partial<User>;
      refreshToken?: string;
    }
  }
}

export {};
