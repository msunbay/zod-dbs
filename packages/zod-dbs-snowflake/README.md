# zod-dbs-snowflake

Snowflake provider for zod-dbs.

## Installation

```bash
npm install zod-dbs-snowflake
# peer dep
npm install snowflake-sdk
```

## CLI Usage

```bash
npx zod-dbs --provider snowflake \
  --host <account>.snowflakecomputing.com \
  --user <user> --password <password> \
  --database <db> --schema-name <schema>
```

## Programmatic Usage

```ts
import { generateZodSchemas } from 'zod-dbs';
import { SnowflakeProvider } from 'zod-dbs-snowflake';

await generateZodSchemas({
  provider: new SnowflakeProvider(),
  config: {
    host: '<account>.snowflakecomputing.com',
    user: '<user>',
    password: '<password>',
    database: '<db>',
    schemaName: '<schema>',
    // optionally: warehouse, role
  },
});
```

## Notes

- Requires `snowflake-sdk` as a peer dependency.
- You must provide both `database` and `schemaName`.
- Data type mapping uses zod-dbs defaults; extend via hooks if needed.
