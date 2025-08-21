import { ZodDbsConnectionConfig } from '../types.js';

export const createConnectionString = (
  options: ZodDbsConnectionConfig
): string => {
  const { host, port, database, user, password } = options;

  if (!user) throw new Error('User is required for connection string.');
  if (!password) throw new Error('Password is required for connection string.');
  if (!host) throw new Error('Host is required for connection string.');
  if (!port) throw new Error('Port is required for connection string.');
  if (!database) throw new Error('Database is required for connection string.');

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
