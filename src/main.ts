import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService<{}, true>);
  const clientUrl =
    configService.get<string>('CLIENT_URL') ??
    `http://${configService.get('HOST')}:${configService.get('CLIENT_PORT')}`;

  app.use(cookieParser());
  app.enableCors({
    origin: clientUrl,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.get('PORT');
  await app.listen(port, '0.0.0.0');
}
bootstrap();
