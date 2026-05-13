import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { RefreshToken } from '@auth/entities/refresh-token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@user/entities/user.entity';
import { sign, verify } from 'jsonwebtoken';
import {
  ACCESS_TOKEN_LIFETIME_SEC,
  REFRESH_TOKEN_LIFETIME_MS,
  REFRESH_TOKEN_LIFETIME_SEC,
} from '@auth/constants/jwt-tokens.constant';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@user/users.service';
import { ITokenPayload } from '@auth/interfaces/token-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  generateAccessToken(user: User): string {
    const payload: ITokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    return sign(payload, String(process.env.ACCESS_TOKEN_SECRET), {
      expiresIn: ACCESS_TOKEN_LIFETIME_SEC,
    });
  }

  generateRefreshToken(): string {
    return sign({}, String(process.env.REFRESH_TOKEN_SECRET), {
      expiresIn: REFRESH_TOKEN_LIFETIME_SEC,
    });
  }

  async saveRefreshToken(user: User, token: string): Promise<boolean> {
    try {
      await this.refreshTokenRepository.save({
        token,
        user,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS),
      });
      return true;
    } catch {
      return false;
    }
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return this.refreshTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });
  }

  async validateRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      verify(refreshToken, String(process.env.REFRESH_TOKEN_SECRET));

      const tokenEntity = await this.findRefreshToken(refreshToken);

      if (!tokenEntity) {
        return false;
      }

      if (new Date() > tokenEntity.expiresAt) {
        await this.removeRefreshToken(refreshToken);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  async exchangeRefreshToken(token: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const existingToken = await this.findRefreshToken(token);

    if (!existingToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = existingToken.user;
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken();

    const saved = await this.saveRefreshToken(user, newRefreshToken);

    if (!saved) {
      throw new InternalServerErrorException('Failed to save refresh token');
    }

    await this.removeRefreshToken(token);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async removeRefreshToken(token: string): Promise<boolean> {
    try {
      const result = await this.refreshTokenRepository.delete({ token });
      return (result.affected ?? 0) > 0;
    } catch (error) {
      return false;
    }
  }

  async authenticateUser(
    email: string,
    password: string,
  ): Promise<User | null> {
    return this.usersService.authenticateUser(email, password);
  }
}
