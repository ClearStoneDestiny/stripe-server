import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { User } from '@user/entities/user.entity';
import { getRequestFromContext } from '@common/helpers/get-request-from-context.helper';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = getRequestFromContext(context);

    let accessToken = this.extractTokenFromHeader(req);

    if (!accessToken) {
      accessToken = req.cookies?.accessToken;
    }

    if (!accessToken) {
      throw new UnauthorizedException('Access token is missing');
    }

    try {
      const parsed = verify(
        accessToken,
        String(process.env.ACCESS_TOKEN_SECRET),
      );

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
