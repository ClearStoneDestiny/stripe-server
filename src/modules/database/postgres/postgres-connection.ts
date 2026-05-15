import { ConfigService } from '@nestjs/config';

export const getPostgresConnection = (configService: ConfigService) => ({
  type: 'postgres',
  host: configService.get<string>('POSTGRES_HOST'),
  port: configService.get<number>('POSTGRES_PORT'),
  username: configService.get<string>('POSTGRES_USER'),
  password: configService.get<string>('POSTGRES_PASSWORD'),
  database: configService.get<string>('POSTGRES_NAME'),
  synchronize: configService.get<boolean>('POSTGRES_SYNCHRONIZE'),
});
