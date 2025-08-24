# zod-dbs-oracle

Oracle connector for zod-dbs. Experimental.

- Uses `oracledb` (peer dependency) at runtime via dynamic import.
- Fetches column metadata from `USER_TAB_COLUMNS` and `USER_COL_COMMENTS`.

## Cli Usage

```bash
npm install zod-dbs-cli zod-dbs-oracle

npx zod-dbs --provider oracle
```

## Usage

Programmatic:

```ts
import { generateZodSchemas } from 'zod-dbs';
import { OracleProvider } from 'zod-dbs-oracle';

const provider = new OracleProvider();

await generateZodSchemas({
  provider,
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
