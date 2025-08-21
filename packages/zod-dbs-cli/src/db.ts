import { ZodDbsConnector } from './types.js';

export const getDbConnector = async (connector: ZodDbsConnector) => {
  if (connector === 'pg') {
    const { PostgreSqlConnector } = await import('zod-dbs-pg');
    return new PostgreSqlConnector();
  }

  throw new Error(`Unsupported database connector: ${connector}`);
};
