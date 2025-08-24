# zod-dbs-oracle

Oracle connector for zod-dbs. Experimental.

## Cli Usage

```bash
npm install zod-dbs-cli zod-dbs-oracle

npx zod-dbs --provider oracle
```

## Programmatic Usage

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
