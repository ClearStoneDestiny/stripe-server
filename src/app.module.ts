import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { validate } from '@common/utils/env.validation';
import { UsersModule } from '@user/users.module';
import { AuthModule } from '@auth/auth.module';
import { DatabaseModule } from '@database/database.module';
import { StripeModule } from '@stripe/stripe.module';
import { CatalogModule } from '@catalog/catalog.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      validate,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    CatalogModule,
    StripeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
