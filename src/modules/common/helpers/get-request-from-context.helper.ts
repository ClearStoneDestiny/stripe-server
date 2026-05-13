import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';

interface RequestWithRefreshToken extends Request {
  refreshToken?: string;
}

export const getRequestFromContext = (
  context: ExecutionContext,
): RequestWithRefreshToken => {
  if (context.getType<'graphql'>() === 'graphql') {
    const gqlCtx = GqlExecutionContext.create(context);
    return gqlCtx.getContext().req;
  }

  return context.switchToHttp().getRequest();
};
