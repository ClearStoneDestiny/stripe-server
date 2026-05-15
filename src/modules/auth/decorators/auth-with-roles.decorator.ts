import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/guards/roles.guard';
import { UserRolesEnum } from '@user/enums/user-roles.enum';
import { Roles } from '@auth/decorators/roles.decorator';

export function AuthWithRoles(...roles: UserRolesEnum[]) {
  return applyDecorators(
    Roles(...(roles.length ? roles : [UserRolesEnum.USER])),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
}
