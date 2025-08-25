# zod-dbs-oracle

Oracle provider for zod-dbs. Experimental.

## Installation

```bash
npm install zod-dbs-oracle
```

> Note: This package has a peer dependency on `oracledb`. If you don't already have it, install it:

```bash
npm install oracledb
```

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
