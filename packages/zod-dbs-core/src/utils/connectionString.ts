import { ZodDbsConnectionConfig } from '../types.js';

export const createConnectionString = (
  options: ZodDbsConnectionConfig
): string => {
  const { host, port, database, user, password } = options;

  if (!user || !password || !host || !port || !database) {
    throw new Error(
      'Incomplete connection configuration. Please provide all required fields.'
    );
  }

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
};

export const parseConnectionString = (
  connectionString: string
): ZodDbsConnectionConfig => {
  const url = new URL(connectionString);
  const user = url.username;
  const password = url.password;
  const host = url.hostname;
  const port = url.port ? parseInt(url.port, 10) : 5432; // Default PostgreSQL port
  const database = url.pathname.slice(1); // Remove leading '/'

  return {
    host,
    port,
    database,
    user,
    password,
  };
};
