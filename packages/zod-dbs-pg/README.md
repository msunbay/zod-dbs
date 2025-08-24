# zod-dbs-pg

PostgreSQL provider for [zod-dbs](https://github.com/msolvaag/zod-dbs).

## Installation

```bash
npm install zod-dbs-pg
```

> Note: This package has a peer dependency on `pg`. If you don't already have it, install it:

```bash
npm install pg
```

## Cli Usage

```bash
npm install zod-dbs-cli zod-dbs-pg

npx zod-dbs --provider pg
```

## Programmatic Usage

```bash
npm install zod-dbs zod-dbs-pg
```

```ts
import { generateZodSchemas } from 'zod-dbs';
import { PostgreSqlProvider } from 'zod-dbs-pg';

const provider = new PostgreSqlProvider();

await generateZodSchemas({
  provider,
  config: {
    // See zod-dbs documentation for available options
  },
});
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
