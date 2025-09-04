import { ZodDbsConnectionConfig } from '../types.js';

export const createConnectionString = (
  options: ZodDbsConnectionConfig
): string => {
  const {
    host = 'localhost',
    port,
    database,
    user,
    password,
    protocol = 'db',
  } = options;

  let connectionString = `${protocol}://`;

  if (user) {
    connectionString += user;
    if (password) {
      connectionString += `:${password}`;
    }

    connectionString += `@${host}`;
  } else {
    connectionString += host;
  }

  if (port) {
    connectionString += `:${port}`;
  }

  if (database) {
    connectionString += `/${database}`;
  }

  return connectionString;
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
  const protocol = url.protocol.replace(':', ''); // Remove trailing ':'

  return {
    host,
    port,
    database,
    user,
    password,
    protocol,
  };
};
