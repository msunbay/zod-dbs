# zod-dbs-snowflake

Snowflake provider for zod-dbs.

## Notes

- Requires `snowflake-sdk` as a peer dependency.
- You must provide both `database` and `schemaName`.
- You currently must use a configuration file to specify options like `account`, `token`, `warehouse`, and `role`.

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
  --database <db> --schema-name <schema>
```

```ts
import { ZodDbsCliConfig } from 'zod-dbs-cli';
import { createProvider } from 'zod-dbs-snowflake';

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
