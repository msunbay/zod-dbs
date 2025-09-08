/**
 * Configuration for database connection.
 */
interface ZodDbsConnectionConfig {
  scheme?: string; // e.g., 'postgresql', 'mysql', etc.
  /** Database port (default: 5432) */
  port?: number;
  /** Database host (default: localhost) */
  host?: string;
  /** Database name to connect to */
  database?: string;
  /** Username for authentication */
  user?: string;
  /** Password for authentication */
  password?: string;
}

export const createConnectionString = (
  options: ZodDbsConnectionConfig
): string => {
  const {
    host = 'localhost',
    port,
    database,
    user,
    password,
    scheme = 'db',
  } = options;

  let connectionString = `${scheme}://`;

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

/**
 * Parses database connection strings, e.g., 'postgresql://user:pass@localhost:5432/dbname'
 */
export const parseConnectionString = (
  connectionString: string
): ZodDbsConnectionConfig => {
  const url = new URL(connectionString);
  const user = url.username;
  const password = url.password;
  const host = url.hostname;
  const port = url.port ? parseInt(url.port, 10) : undefined;
  const database = url.pathname.slice(1); // Remove leading '/'
  const scheme = url.protocol.replace(':', ''); // Remove trailing ':'

  return {
    host,
    port,
    database,
    user,
    password,
    scheme,
  };
};
