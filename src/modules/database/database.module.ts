import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '@user/entities/user.entity';
import { RefreshToken } from '@auth/entities/refresh-token.entity';
import { getDatabaseConfig } from './configs/database.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        ...getDatabaseConfig(configService),
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
