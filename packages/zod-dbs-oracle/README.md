# zod-dbs-oracle

Oracle connector for zod-dbs. Experimental.

- Uses `oracledb` (peer dependency) at runtime via dynamic import.
- Fetches column metadata from `USER_TAB_COLUMNS` and `USER_COL_COMMENTS`.
- Exposes `createProvider()` for programmatic/CLI dynamic loading as `zod-dbs-oracle`.

## Install

```sh
pnpm add zod-dbs-oracle oracledb
```

Note: `oracledb` requires native dependencies; see the official docs if build fails.

## Usage

Programmatic:

```ts
import { generateZodSchemas } from 'zod-dbs';
import { createProvider } from 'zod-dbs-oracle';

await generateZodSchemas({
  provider: createProvider(),
  config: {
    host: 'localhost',
    port: 1521,
    database: 'XEPDB1',
    user: 'system',
    password: 'oracle',
    schemaName: 'SYSTEM',
    outputDir: './zod-schemas',
  },
});
```
