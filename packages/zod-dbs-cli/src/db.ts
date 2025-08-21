import { ZodDbsProvider } from './types.js';

export const getDbConnector = async (connector: ZodDbsProvider) => {
  if (connector === 'pg') {
    const { PostgreSqlConnector } = await import('zod-dbs-pg');
    return new PostgreSqlConnector();
  }

  if (connector === 'mysql') {
    const { MySqlConnector } = await import('zod-dbs-mysql');
    return new MySqlConnector();
  }

  throw new Error(`Unsupported database connector: ${connector}`);
};
