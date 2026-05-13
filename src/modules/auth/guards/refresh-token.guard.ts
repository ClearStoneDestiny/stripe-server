import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@Auth/auth.service';
import { getRequestFromContext } from '@Common/helpers/get-request-from-context.helper';
import { getHeaderValue } from '@/modules/common/helpers/get-header-value.helper';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = getRequestFromContext(context);

    let refreshToken = getHeaderValue(req.headers, 'x-refresh-token');

    if (!refreshToken) {
      refreshToken = req.cookies?.refreshToken;
    }

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    req.refreshToken = refreshToken;

    const isValid = await this.authService.validateRefreshToken(refreshToken);

    if (!isValid) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    return true;
  }
}
