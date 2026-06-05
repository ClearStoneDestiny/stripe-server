import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsString()
  HOST = 'localhost';

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(65535)
  CLIENT_PORT = 5173;

  @IsString()
  @IsOptional()
  CLIENT_URL?: string;

  @IsString()
  @IsNotEmpty()
  ACCESS_TOKEN_SECRET: string;

  @IsString()
  @IsNotEmpty()
  REFRESH_TOKEN_SECRET: string;

  @IsString()
  @IsNotEmpty()
  STRIPE_SECRET_KEY: string;

  @IsString()
  @IsNotEmpty()
  STRIPE_WEBHOOK_SECRET: string;

  @IsIn(['postgres'])
  DB_TYPE = 'postgres';

  @IsString()
  @IsOptional()
  DB_HOST?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(65535)
  @IsOptional()
  DB_PORT?: number;

  @IsString()
  @IsOptional()
  DB_USER?: string;

  @IsString()
  @IsOptional()
  DB_PASSWORD?: string;

  @IsString()
  @IsOptional()
  DB_NAME?: string;

  @IsIn(['true', 'false'])
  @IsOptional()
  SYNCHRONIZE?: 'true' | 'false';

  @IsString()
  @IsNotEmpty()
  POSTGRES_HOST: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(65535)
  POSTGRES_PORT: number;

  @IsString()
  @IsNotEmpty()
  POSTGRES_USER: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_NAME: string;

  @IsIn(['true', 'false'])
  POSTGRES_SYNCHRONIZE: 'true' | 'false' = 'false';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig);

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
