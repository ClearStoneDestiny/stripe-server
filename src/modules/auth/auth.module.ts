import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from '@auth/entities/refresh-token.entity';
import { AuthController } from '@auth/auth.controller';
import { AuthService } from '@auth/auth.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { User } from '@user/entities/user.entity';
import { UsersModule } from '@user/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ACCESS_TOKEN_LIFETIME_SEC } from '@auth/constants/jwt-tokens.constant';
import { RefreshTokenGuard } from '@auth/guards/refresh-token.guard';
import { RolesGuard } from '@auth/guards/roles.guard';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([RefreshToken, User]),
    JwtModule.register({
      secret: process.env.ACCESS_TOKEN_SECRET,
      signOptions: { expiresIn: ACCESS_TOKEN_LIFETIME_SEC },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RefreshTokenGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
