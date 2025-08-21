import { ZodDbsConnectionConfig } from '../types.js';

export const createConnectionString = (
  options: ZodDbsConnectionConfig
): string => {
  const { host, port, database, user, password, connectionString } = options;

  if (connectionString) {
    return connectionString;
  }

  if (!user || !password || !host || !port || !database) {
    throw new Error(
      'Incomplete connection configuration. Please provide all required fields.'
    );
  }

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
};
