# zod-dbs-sqlite

SQLite provider for [zod-dbs](https://github.com/msunbay/zod-dbs).

## Installation

```bash
npm install zod-dbs-sqlite better-sqlite3
```

> Note: This package has a peer dependency on `better-sqlite3`. If you don't already have it, install it alongside.

## Cli Usage

```bash
npm install zod-dbs-cli zod-dbs-sqlite better-sqlite3

npx zod-dbs --provider sqlite
```

## Programmatic Usage

```bash
npm install zod-dbs zod-dbs-sqlite better-sqlite3
```

```ts
import { generateZodSchemas } from 'zod-dbs';
import { SqliteProvider } from 'zod-dbs-sqlite';

const provider = new SqliteProvider();

await generateZodSchemas({
  provider,
  config: {
    // See zod-dbs documentation for available options
    // Example (SQLite):
    // database: 'path/to/db.sqlite',
    // schemaName: 'main',
    // outputDir: './zod-schemas',
  },
});
```
