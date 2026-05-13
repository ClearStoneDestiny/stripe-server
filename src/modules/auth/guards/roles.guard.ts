import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRolesEnum } from '@Users/enums/user-roles.enum';
import { ROLES_KEY } from '@Auth/decorators/roles.decorator';
import { getRequestFromContext } from '@Common/helpers/get-request-from-context.helper';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRolesEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const req = getRequestFromContext(context);
    const { user } = req;

    if (!user || !user.role) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
