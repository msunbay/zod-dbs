# zod-dbs-snowflake

Snowflake provider for zod-dbs.

## Notes

- Requires `snowflake-sdk` as a peer dependency.
- You must provide both `database` and `schemaName`.
- Enum types are not yet supported.

## Installation

```bash
npm install zod-dbs-snowflake
```

> Note: This package has a peer dependency on `snowflake-sdk`. If you don't already have it, you might need to install it (depending on your environment, package manager, etc):

```bash
npm install snowflake-sdk
```

## CLI Usage

```bash
npx zod-dbs --provider snowflake \
  --host <account>.snowflakecomputing.com \
  --user <user> --password <password> \
  --account <account> --token <token> \
  --warehouse <warehouse> --role <role> \ # optional
  --database <db> --schema-name <schema>
```

### Provider Specific CLI Options

| Option                   | Description                                                       | Required |
| ------------------------ | ----------------------------------------------------------------- | -------- |
| `--host <host>`          | Snowflake account URL host (e.g., xy12345.snowflakecomputing.com) |          |
| `--account <account>`    | Snowflake account identifier (required)                           | `true`   |
| `--user <user>`          | Username for authentication                                       |          |
| `--password <password>`  | Password for authentication                                       |          |
| `--database <db>`        | Database name to connect to (required)                            | `true`   |
| `--schema-name <schema>` | Schema name to introspect (required)                              | `true`   |
| `--token <token>`        | JWT token for authentication                                      |          |
| `--role <role>`          | Role to assume after connecting                                   |          |
| `--warehouse <name>`     | Virtual warehouse to use                                          |          |

### Configuration File Example

```ts
import { ZodDbsCliConfig } from 'zod-dbs-cli';

// Import needed to load the provider specific configuration types.
import 'zod-dbs-snowflake';

const config: ZodDbsCliConfig = {
  provider: createProvider(),
  account: '<account>',
  token: '<token>',
  warehouse: '<warehouse>', // optional
  role: '<role>', // optional
};

export default config;
```

## Programmatic Usage

```ts
import { generateZodSchemas } from 'zod-dbs';
import { createProvider } from 'zod-dbs-snowflake';

await generateZodSchemas({
  provider: createProvider(),
  config: {
    account: '<account>',
    host: '<account>.snowflakecomputing.com',
    user: '<user>',
    password: '<password>',
    token: '<token>',
    database: '<db>',
    schemaName: '<schema>',
    // optionally: warehouse, role
  },
});
```
