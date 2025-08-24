# zod-dbs-pg

PostgreSQL provider for [zod-dbs](https://github.com/msolvaag/zod-dbs).

## Installation

```bash
npm install zod-dbs-pg
```

> Note: This package has a peer dependency on `pg`. If you don't already have it, install it:

```bash
npm install pg
```

## Cli Usage

```bash
npm install zod-dbs-cli zod-dbs-pg

npx zod-dbs --provider pg
```

## Programmatic Usage

```bash
npm install zod-dbs zod-dbs-pg
```

```ts
import { generateZodSchemas } from 'zod-dbs';
import { PostgreSqlProvider } from 'zod-dbs-pg';

const provider = new PostgreSqlProvider();

await generateZodSchemas({
  provider,
  config: {
    // See zod-dbs documentation for available options
  },
});
```
