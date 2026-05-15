import { DatabaseTypeEnum } from '@database/enums/database-type.enum';
import { getPostgresConnection } from '@database/postgres/postgres-connection';
import { ConfigService } from '@nestjs/config';

const DATABASE_SETTINGS = {
  [DatabaseTypeEnum.POSTGRES]: getPostgresConnection,
};

export const getDatabaseConfig = (configService: ConfigService) => {
  const databaseType = configService.get<string>(
    'DB_TYPE',
    DatabaseTypeEnum.POSTGRES,
  );
  const selectedConfig = DATABASE_SETTINGS[databaseType];

  if (!selectedConfig) {
    throw new Error(`Unsupported database type: ${databaseType}`);
  }

  return selectedConfig(configService);
};
