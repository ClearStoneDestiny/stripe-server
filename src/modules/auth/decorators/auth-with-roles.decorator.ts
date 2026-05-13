import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/guards/roles.guard';
import { UserRolesEnum } from '@user/enums/user-roles.enum';

export function AuthWithRoles() {
  return applyDecorators(
    SetMetadata('roles', [UserRolesEnum.USER]),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
}
