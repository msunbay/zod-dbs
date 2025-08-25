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

> Note: This package has a peer dependency on `snowflake-sdk`. If you don't already have it, install it:

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

### CLI Options

| Option                | Description                        | Required |
| --------------------- | ---------------------------------- | -------- |
| `--schema-name <str>` | Name of the schema to introspect   | `true`   |
| `--database <str>`    | Name of the database to connect to | `true`   |
| `--account <str>`     | Snowflake account identifier       | `true`   |
| `--token <str>`       | Snowflake token for authentication |          |
| `--warehouse <str>`   | Snowflake warehouse to use         |          |
| `--role <str>`        | Snowflake role to use              |          |

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
import { SnowflakeProvider } from 'zod-dbs-snowflake';

await generateZodSchemas({
  provider: new SnowflakeProvider(),
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
