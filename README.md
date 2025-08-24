# zod-dbs

![npm version](https://img.shields.io/npm/v/zod-dbs?style=flat-square)
![license](https://img.shields.io/npm/l/zod-dbs?style=flat-square)
![downloads](https://img.shields.io/npm/dm/zod-dbs?style=flat-square)

**zod-dbs** is a code generation tool that creates [Zod](https://github.com/colinhacks/zod) schemas and TypeScript types from your database schema. It generates validation schemas that match your database structure, helping keep your TypeScript types synchronized with your database schema.

## Table of Contents

- [Key Features](#key-features)
- [Requirements](#requirements)
- [Why zod-dbs?](#why-zod-dbs)
- [Supported Database Providers](#supported-database-providers)
- [Installation](#installation)
- [Quickstart](#quickstart)
- [CLI usage](#cli-usage)
  - [With connection string](#with-connection-string)
  - [With options](#with-options)
  - [With environment variables](#with-environment-variables)
  - [Using .env files](#using-env-files)
  - [Exclude / Include Tables](#exclude--include-tables)
  - [All Options](#all-options)
  - [Configuration File](#configuration-file)
  - [SSL Support](#ssl-support)
- [Programmatic usage](#programmatic-usage)
- [Output File Structure](#output-file-structure)
- [Schema Output](#schema-output)
  - [The Read Schemas](#the-read-schemas)
  - [The Write Schemas](#the-write-schemas)
  - [Casing](#casing)
  - [Singularization](#singularization)
- [JSON Schema Support](#json-schema-support)
  - [Setting up JSON Schema Integration](#setting-up-json-schema-integration)
- [Customizing Generated Models with Hooks](#customizing-generated-models-with-hooks)
- [Extending schemas](#extending-schemas)
- [Custom Provider](#custom-provider)
- [Contributing](#contributing)

## Key Features

- **Database-First Development** – Generate Zod schemas directly from your database schema.
- **Multiple Schema Types** – Separate read, insert, and update schemas for clearer intent.
- **Multiple Zod Versions** – Generate for Zod v3, v4, or the lightweight v4-mini build.
- **Db Coverage** – Arrays, enums, custom types, materialized views, foreign tables.
- **Type Detection** – Detects serial, enum, array, and nullable characteristics automatically.
- **Customization** – Hooks, casing transformations, singularization control.
- **Organized Output** – Predictable file structure (constants, types, per-table schemas).
- **No Runtime Dependencies** – Generated artifacts only depend on Zod.

## Requirements

- **Node.js 20+**

## Why zod-dbs?

Manually writing and maintaining TypeScript types and Zod schemas for database tables is time-consuming and error-prone.

zod-dbs automates this process by generating type-safe validation schemas directly from your database schema. This approach ensures your validation logic stays synchronized with your database structure, eliminating the manual work of writing and updating schemas when your database changes. Whether you're building APIs that need request validation, working with complex features like arrays and enums, or maintaining type safety across your entire stack, zod-dbs bridges the gap between your database and TypeScript application.

## Supported Database Providers

- PostgreSQL: [zod-dbs-pg](./packages/zod-dbs-pg/README.md)
  - Compatible with managed PostgreSQL (AlloyDB, Amazon RDS, Cloud SQL, Azure Database for PostgreSQL, Neon, Supabase, etc.). See the provider README for details.
- MySQL: [zod-dbs-mysql](./packages/zod-dbs-mysql/README.md) (experimental)
- Microsoft SQL Server: [zod-dbs-mssql](./packages/zod-dbs-mssql/README.md) (experimental)
- Oracle: [zod-dbs-oracle](./packages/zod-dbs-oracle/README.md) (experimental)
- SQLite: [zod-dbs-sqlite](./packages/zod-dbs-sqlite/README.md) (experimental)

## Installation

zod-dbs comes with a CLI tool to generate Zod schemas from your database schema. The CLI supports multiple database providers and allows you to customize the output.

```sh
npm install --save-dev zod-dbs-cli
# or
pnpm add -D zod-dbs-cli
```

Then the provider you need:

```sh
npm install --save-dev zod-dbs-pg
# or
pnpm add -D zod-dbs-pg
```

## Quickstart

1. Install the CLI and a provider

```sh
pnpm add -D zod-dbs-cli zod-dbs-pg
```

2. Generate schemas

```sh
npx zod-dbs --provider pg \
  --connection-string "postgres://user:password@localhost:5432/dbname" \
  --output-dir ./zod-schemas --silent
```

3. Explore the output in `./zod-schemas`.

## CLI usage

### With connection string

```sh
npx zod-dbs --provider pg --connection-string "postgres://user:password@localhost:5432/dbname" --ssl --output-dir ./src/output
```

### With options

You can also specify options directly:

```sh
npx zod-dbs --provider pg --user postgres --password secret --host localhost --port 5432 --database mydb --ssl --output-dir ./src/output
```

### With environment variables

zod-dbs can read connection details from environment variables. Set the following variables:

- `ZOD_DBS_USER`
- `ZOD_DBS_PASSWORD`
- `ZOD_DBS_HOST`
- `ZOD_DBS_PORT`
- `ZOD_DBS_DB`
- `ZOD_DBS_SSL` (optional, defaults to `false`)

Then run:

```sh
npx zod-dbs --provider pg --output-dir ./src/output
```

### Using .env files

zod-dbs does not automatically load `.env` files, but you can use a package like `dotenv-cli` to load them before running zod-dbs. For example:

```sh
dotenv -e .env npx zod-dbs --provider pg --output-dir ./src/output
```

### Exclude / Include Tables

You can exclude specific tables from schema generation using the `--exclude` option with a regex pattern. For example, to exclude all tables starting with "temp":

```sh
npx zod-dbs --exclude '^temp_' --output-dir ./src/output
```

To include only specific tables, use the `--include` option with a regex pattern. For example, to include only tables starting with "user" or "account":

```sh
npx zod-dbs --include '^(user|account)' --output-dir ./src/output
```

Note that if you use both `--exclude` and `--include` options together, the `--include` option is applied first, then the `--exclude` option is applied to the included tables.

### All Options

All CLI options are optional. Sensible defaults are applied (e.g. output defaults to `./zod-schemas`, schema defaults to `public`). Values can be provided via:

- CLI flags (highest precedence)
- Environment variables (connection fields)
- Config file (`zod-dbs.config.{js,ts,json}`)
- Built-in defaults

Negative flags (`--no-*`) disable a feature that is enabled by default.

| Option                                 | Description                                                                                       | Default         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------- |
| `--provider <string>`                  | DB connection provider (pg, mysql, mssql, oracle, sqlite)                                         |                 |
| `--connection-string <string>`         | DB connection string (overrides individual host/port/user/etc).                                   |                 |
| `-o, --output-dir <path>`              | Output directory for generated files.                                                             | `./zod-schemas` |
| `--clean-output`                       | Delete the output directory before generation.                                                    | `false`         |
| `--no-coerce-dates`                    | Disable using `z.coerce.date()` for date columns in read schemas (coercion enabled by default).   | `false`         |
| `--no-stringify-json`                  | Disable `JSON.stringify()` transforms for `json` fields in write schemas.                         | `false`         |
| `--stringify-dates`                    | Add `.toISOString()` transforms for date fields in write schemas.                                 | `false`         |
| `--default-empty-array`                | Default nullable array fields to `[]` in write schemas.                                           | `false`         |
| `--object-name-casing <value>`         | Casing for object/type names (one of: `PascalCase`, `camelCase`, `snake_case`).                   | `PascalCase`    |
| `--field-name-casing <value>`          | Casing for field/property names (one of: `PascalCase`, `camelCase`, `snake_case`, `passthrough`). | `camelCase`     |
| `--no-case-transform`                  | Disable transforming property name casing (skips base schema + transform helpers).                | `false`         |
| `--no-singularization`                 | Preserve plural table / enum names (singularization on by default).                               | `false`         |
| `--include <regex>`                    | Include only tables matching this regex (applied before exclude).                                 |                 |
| `--exclude <regex>`                    | Exclude tables matching this regex.                                                               |                 |
| `--json-schema-import-location <path>` | Path to import custom JSON field schemas from.                                                    |                 |
| `--module-resolution <type>`           | Module resolution: `commonjs` or `esm`.                                                           | `commonjs`      |
| `--zod-version <version>`              | Target Zod variant: `3`, `4`, or `4-mini`.                                                        | `3`             |
| `--schema-name <name>`                 | Database schema to introspect.                                                                    | `public`        |
| `--host <host>`                        | DB host (ignored if connection string provided).                                                  | `localhost`     |
| `--port <number>`                      | DB port (ignored if connection string provided).                                                  | `5432`          |
| `--user <user>`                        | DB user (ignored if connection string provided).                                                  | `postgres`      |
| `--password <password>`                | DB password (ignored if connection string provided).                                              |                 |
| `--database <name>`                    | DB name (ignored if connection string provided).                                                  | `postgres`      |
| `--ssl`                                | Use SSL for connection.                                                                           | `false`         |
| `--silent`                             | Suppress console output (still writes files).                                                     | `false`         |
| `--debug`                              | Enable verbose debug logging.                                                                     | `false`         |
| `--help`                               | Show help and exit.                                                                               |                 |

### Configuration File

In addition to CLI options, you can use configuration files to set your options. zod-dbs-cli uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig).

#### Example Configuration File

**zod-dbs.config.ts:**

```typescript
import type { ZodDbsCliConfig } from 'zod-dbs-cli';

const config: ZodDbsCliConfig = {
  provider: 'pg',

  user: 'postgres',
  password: 'secret',
  host: 'localhost',
  port: 5432,
  database: 'mydb',

  outputDir: './src/generated',
  include: ['users', 'posts'],
  exclude: ['^temp_'],
  zodVersion: '4',
  stringifyDates: true,
  defaultEmptyArray: true,
};

export default config;
```

**zod-dbs.config.js:**

```javascript
module.exports = {
  provider: 'mysql',

  user: 'user',
  database: 'mydb',
  password: 'secret',
  host: 'localhost',
  port: 3306,
  schemaName: 'mydb',

  outputDir: './src/generated',
};
```

### SSL Support

To connect to databases that require SSL, use the `--ssl` flag. For more advanced SSL configurations (e.g., providing certificates), you can provide parameters using the `ssl` option in a configuration file.

Note that the exact SSL options depend on the database provider you are using. Refer to the documentation of the specific provider for supported SSL options.

```ts
import type { ZodDbsCliConfig } from 'zod-dbs-cli';

const config: ZodDbsCliConfig = {
  provider: 'pg',
  ssl: {
    rejectUnauthorized: false,
    ca: fs.readFileSync('/path/to/ca.crt').toString(),
    key: fs.readFileSync('/path/to/client.key').toString(),
    cert: fs.readFileSync('/path/to/client.crt').toString(),
  },
};

export default config;
```

## Programmatic usage

Use the library directly in Node/TypeScript if you prefer code over the CLI.

```bash
npm install zod-dbs zod-dbs-pg
```

```ts
import { generateZodSchemas } from 'zod-dbs';
import { createProvider } from 'zod-dbs-pg';

await generateZodSchemas({
  provider: createProvider(),
  config: {
    host: 'localhost',
    port: 5432,
    database: 'mydb',
    user: 'postgres',
    password: 'secret',
    schemaName: 'public',
    outputDir: './zod-schemas',
    zodVersion: '4',
  },
});
```

## Output File Structure

The generator creates a predictable structure:

- `output/constants.ts` – Constants for all table and view names.
- `output/types.ts` – TypeScript types for all tables and views.
- `output/tables/<table>/schema.ts` – Zod schemas for the table (read / insert / update; plus base + transform when casing enabled).
- `output/tables/<table>/index.ts` – Re-exports for the table.
- `output/tables/index.ts` – Aggregated exports of all table schemas & types.
- (Folders `views/` and `materialized_views/` are generated similarly when those relation types exist.)

## Schema Output

The generated Zod schemas will look something like this: (example for a "users" table)

```ts
// output/tables/users/schema.ts
import { z } from "zod";

export const UsersTableSchema = z.object({..});
export const UsersTableInsertSchema = z.object({..});
export const UsersTableUpdateSchema = UsersTableInsertSchema.partial();

export interface UserRecord {
  // TypeScript interface with proper types
}

export interface UserInsertRecord {
  // TypeScript interface for insert operations
}

export type UserUpdateRecord = Partial<UserInsertRecord>;
```

Since reading and writing are two different operations, zod-dbs generates separate schemas for reads, inserts and updates. The `UsersTableInsertSchema` is used for creating new records, while the `UsersTableUpdateSchema` is a partial version of the insert schema, allowing you to update only specific fields.

### The Read Schemas

- Used for reading data from the database.
- Does not enforce write constraints (e.g., max length).
- By default transforms nulls to `undefined`, making it easier to work with optional fields in TypeScript.
- Optionally defaults nullable array fields to empty arrays.

### The Write Schemas

- Enforces field constraints such as max length, ensuring that your data adheres to the database schema.
- By default transforms `json` fields to strings.
- Optionally transforms date fields to ISO strings using `.toISOString()`.
- Excludes only SERIAL/auto-incrementing columns and columns from non-table relations (views, etc.).

### Casing

zod-dbs supports different casing styles for generated schemas and types. By default zod-dbs uses `PascalCase` for object names and `camelCase` for properties. You can specify the desired casing for field names and object names using the `--field-name-casing` and `--object-name-casing` options.
The `--no-case-transform` option disables the automatic casing transformation for field names, which means that the generated schemas will use the original database column names as-is without any transformation.

### Singularization

By default zod-dbs converts plural table / view names into singular, PascalCase identifiers when generating TypeScript record types, insert/update record types, enum names, and related constants / transform helpers. This keeps generated symbols concise and aligned with typical TypeScript naming conventions.

Example:

| Database object          | Generated names                                                           |
| ------------------------ | ------------------------------------------------------------------------- |
| `users` (table)          | `UserRecord`, `UserInsertRecord`, `UserUpdateRecord`                      |
| `users_accounts` (table) | `UserAccountRecord`, `UserAccountInsertRecord`, `UserAccountUpdateRecord` |
| `users.roles` (enum)     | `UserRole`                                                                |

If you would prefer the generated identifiers to preserve the original (often plural / snake_case) names, disable singularization with the CLI flag:

```
npx zod-dbs --no-singularization
```

Or in a config file:

```ts
export default {
  // ...other config
  singularization: false,
};
```

When disabled, names are still cased according to your casing settings, but the plural form is retained (e.g. `UsersRecord`).

## Customizing Generated Models with Hooks

zod-dbs provides hooks to customize the generated models during generation. These hooks allow you to add custom validation, transformations, or modifications to your schemas.

### Available Hooks

#### `onColumnInfoCreated`

This hook is called for each column after its initial model is created, allowing you to modify individual column properties.

```typescript
onColumnInfoCreated: (column) => {
  // Add email validation to email columns
  if (column.name === 'email') {
    // Note that this only applies to the write schema.
    // The read schema will still output the field as a z.string.
    column.type = 'email';

    // Additional validation / transformation
    column.writeTransforms = ['trim', 'lowercase'];
  }

  // Add minimum length to password fields
  if (column.name === 'password') {
    // Note that this only applies to the write schema.
    column.minLen = 8;
  }

  // Add custom transformations based on table name
  if (column.tableName === 'users') {
    // Add any table-specific customizations
  }

  return column;
};
```

#### `onTableInfoCreated`

This hook is called for each table after all its columns have been processed, allowing you to modify the table model.

```typescript
onTableInfoCreated: (table) => {
  // Add custom transformations based on table name
  if (table.name === 'users') {
    // Add any table-specific customizations
  }

  return table;
};
```

## JSON Schema Support

zod-dbs cannot determine the structure of JSON fields in your database. To use Zod schemas for JSON fields, you can use the `--json-schema-import-location` option.
When this option is provided, zod-dbs will import Zod schemas from the specified location for JSON fields in your database.

### Setting up JSON Schema Integration

Say you have a "user" table with a JSON field called "profile", and you want to use a Zod schema for that JSON field.

**Step 1: Run zod-dbs with JSON schema import location**

Start by running, e.g.,

```sh
npx zod-dbs --json-schema-import-location '../../json' --output-dir ./schema/generated
```

**Step 2: Generated schema imports your JSON schemas**

This will create a `./schema/generated/tables/users/schema.ts` file looking similar to this:

```ts
import { z } from 'zod';

import { UserProfileSchema } from '../../json';

export const UsersTableSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  profile: UserProfileSchema,
});
```

The JSON Zod schema name is derived from `[TableName][FieldName]Schema`, so in this case, it will look for `UserProfileSchema` in the specified import location.

**Step 3: Create your JSON schemas**

Then you can create a Zod schema for the JSON field in your specified import location.

e.g

```ts
// src/schema/json.ts
import { z } from 'zod';

export const UserProfileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  age: z.number().optional(),
});
```

## Extending schemas

It is possible to extend the generated Zod schemas with additional fields / rules / transformations.
This is especially handy if you are doing a joined query.

To extend a read schema you need to import the base read schema and apply the casing transformations afterwards (if needed).
e.g.

```ts
import {
  transformUserBaseRecord,
  UsersTableBaseSchema,
} from '[output]/tables/users';

const ExtendedSchema = UsersTableBaseSchema.extend({
  permissions: z.array(z.string()).nullish().optional(),
  signed_in_at: z.coerce.date().nullish().optional(),
}).transform((data) => ({
  ...transformUserBaseRecord(data),
  permissions: data.permissions,
  signedInAt: data.signed_in_at,
}));
```

If you have disabled case transforms (`--no-case-transform`) then there are no "base" schemas or transform functions.
And you can just extend the read schema like:

```ts
import { UsersTableSchema } from '[output]/tables';

const ExtendedSchema = UsersTableSchema.extend({
  permissions: z.array(z.string()).nullish().optional(),
  signed_in_at: z.coerce.date().nullish().optional(),
});
```

## Custom Provider

If you want to support a database that is not supported out of the box, you can create a custom provider by implementing the `ZodDbsProvider` interface (available from `zod-dbs`).

### Extending the base provider

zod-dbs provides a base class `ZodDbsBaseProvider` that you can extend to create your custom provider. This base class provides default implementations for some methods, so you only need to implement the methods that are specific to your database.

```ts
import { ZodDbsBaseProvider } from 'zod-dbs';

import type { ZodDbsColumnInfo, ZodDbsProviderConfig } from 'zod-dbs';
import type { ZodDbsCliConfig } from 'zod-dbs-cli';

// zod-dbs.config.ts

class CustomProvider extends ZodDbsBaseProvider {
  constructor() {
    super({
      name: 'my-custom-provider',
      displayName: 'My Custom Provider',
    });
  }

  protected override async fetchSchemaInfo(
    _config: ZodDbsProviderConfig
  ): Promise<ZodDbsColumnInfo[]> {
    // Implement logic to fetch column information from your database.
    // Looking at existing providers can be helpful.
    return [];
  }
}

const config: ZodDbsCliConfig = {
  provider: new CustomProvider(),
  // Other config options
};

export default config;
```

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request.
