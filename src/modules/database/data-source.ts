import { DataSource } from 'typeorm';
import { User } from '@user/entities/user.entity';
import { RefreshToken } from '@auth/entities/refresh-token.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: process.env.DB_TYPE as any,
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_NAME,
  entities: [User, RefreshToken],
  migrations: ['src/modules/databases/migrations/*.ts'],
  synchronize: true,
});
