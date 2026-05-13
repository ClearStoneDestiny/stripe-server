import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@user/entities/user.entity';
import { getRequestFromContext } from '@common/helpers/get-request-from-context.helper';
import { JwtService } from '@nestjs/jwt';
import { JWT_TOKEN_SETTINGS } from '@auth/configs/jwt-token-settings.config';
import { ITokenPayload } from '@auth/interfaces/token-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = getRequestFromContext(context);

    let accessToken = this.extractTokenFromHeader(req);

    if (!accessToken) {
      accessToken = req.cookies?.[JWT_TOKEN_SETTINGS.ACCESS_TOKEN.name];
    }

    if (!accessToken) {
      throw new UnauthorizedException('Access token is missing');
    }

    try {
      const parsed = this.jwtService.verify<ITokenPayload>(accessToken, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });

      if (typeof parsed === 'string') {
        throw new UnauthorizedException('Invalid token format');
      }

      req.user = {
        id: parsed.id,
        email: parsed.email,
        role: parsed.role,
      } as Partial<User>;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Access token is invalid or expired');
    }
  }

  private extractTokenFromHeader(req: any): string | null {
    const authHeader = req.headers?.authorization;

    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
