import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface RequestWithRefreshToken extends Request {
  refreshToken?: string;
}

export const getRequestFromContext = (
  context: ExecutionContext,
): RequestWithRefreshToken => {
  return context.switchToHttp().getRequest();
};
