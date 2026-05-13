import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from '@auth/entities/refresh-token.entity';
import { AuthController } from '@auth/auth.controller';
import { AuthService } from '@auth/auth.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { UsersModule } from '@user/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ACCESS_TOKEN_LIFETIME_SEC } from '@auth/constants/jwt-tokens.constant';
import { RefreshTokenGuard } from '@auth/guards/refresh-token.guard';
import { RolesGuard } from '@auth/guards/roles.guard';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([RefreshToken]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
        signOptions: { expiresIn: ACCESS_TOKEN_LIFETIME_SEC },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RefreshTokenGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
