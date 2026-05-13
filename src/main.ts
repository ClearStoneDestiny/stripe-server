import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<{}, true>);

  app.use(cookieParser());
  app.enableCors({
    origin: `http://${configService.get<string>('HOST')}:${configService.get<number>('CLIENT_PORT')}`,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.get<number>('PORT');
  await app.listen(port, '0.0.0.0');
}
bootstrap();
