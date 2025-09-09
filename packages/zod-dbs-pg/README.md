# zod-dbs-pg

PostgreSQL provider for [zod-dbs](https://github.com/msunbay/zod-dbs).

## Installation

```bash
npm install zod-dbs-pg
```

> Note: This package has a peer dependency on `pg`. If you don't already have it, you might need to install it (depending on your environment, package manager, etc):

```bash
npm install pg
```

## Cli Usage

```bash
npm install zod-dbs-cli zod-dbs-pg

npx zod-dbs --provider pg
```

### Provider Specific CLI Options

| Option                       | Description                                                          |
| ---------------------------- | -------------------------------------------------------------------- | --- |
| `--connection-string <conn>` | Full database connection string (overrides other connection options) |     |
| `--host <host>`              | Database host (default: `localhost`)                                 |     |
| `--port <port>`              | Database server port (default: `5432`)                               |     |
| `--user <user>`              | Database user (default: `postgres`)                                  |     |
| `--password <password>`      | Database password (default: `postgres`)                              |     |
| `--database <db>`            | Database name (default: `postgres`)                                  |     |
| `--schema-name <schema>`     | Database schema to introspect (default: `public`)                    |     |
| `--ssl`                      | Use SSL connection                                                   |     |

## Programmatic Usage

```bash
npm install zod-dbs zod-dbs-pg
```

```ts
import { generateZodSchemas } from 'zod-dbs';
import { createProvider } from 'zod-dbs-pg';

const provider = createProvider();

await generateZodSchemas({
  provider,
  config: {
    // See zod-dbs documentation for available options
  },
});
```

## SSL Support

To connect to databases that require SSL, use the `--ssl` flag. For more advanced SSL configurations (e.g., providing certificates), you can provide parameters using the `ssl` option in a configuration file.

```ts
import { createProvider } from 'zod-dbs-pg';

import type { ZodDbsCliConfig } from 'zod-dbs-cli';

const config: ZodDbsCliConfig = {
  provider: createProvider(),
  ssl: {
    rejectUnauthorized: false,
    ca: fs.readFileSync('/path/to/ca.crt').toString(),
    key: fs.readFileSync('/path/to/client.key').toString(),
    cert: fs.readFileSync('/path/to/client.crt').toString(),
  },
};

export default config;
```

## Compatibility

This provider works with standard PostgreSQL and most managed PostgreSQL services. In many cases, no special configuration is required beyond a valid connection string.

- Works out of the box:
  - PostgreSQL (self-hosted), AWS RDS for PostgreSQL, Aurora PostgreSQL, GCP Cloud SQL for PostgreSQL, Azure Database for PostgreSQL
  - Neon, Supabase, Crunchy Bridge, Aiven, AlloyDB
  - Extensions like TimescaleDB and Citus

- Generally compatible (minor catalog differences may affect advanced features like enum detection):
  - CockroachDB (Postgres wire protocol)
  - YugabyteDB YSQL

- Not supported / limited for introspection:
  - Amazon Redshift (PG-like but diverged catalogs)
  - PG-wire systems that don’t expose standard information_schema/pg_catalog

Tip: If your database speaks the PG wire protocol and exposes standard pg_catalog/info_schema (including pg_type/pg_enum), this provider should work. If those differ, some features may be limited.
