# zod-dbs-mssql

Microsoft SQL Server provider for [zod-dbs](https://github.com/msolvaag/zod-dbs).

## Installation

```bash
npm install zod-dbs-mssql
```

> Note: This package has a peer dependency on `mssql`. If you don't already have it, install it:

```bash
npm install mssql
```

## Cli Usage

```bash
npm install zod-dbs-cli zod-dbs-mssql

npx zod-dbs --provider mssql
```

## Programmatic Usage

```ts
import { generateZodSchemas } from 'zod-dbs';
import { MsSqlServerProvider } from 'zod-dbs-mssql';

const provider = new MsSqlServerProvider();

await generateZodSchemas({
  provider,
  config: {
    // See zod-dbs documentation for available options
  },
});
```
