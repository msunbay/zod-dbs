# zod-dbs-sqlite

SQLite provider for [zod-dbs](https://github.com/msunbay/zod-dbs).

## Installation

```bash
npm install zod-dbs-sqlite
```

> Note: This package has a peer dependency on `better-sqlite3`. If you don't already have it, you might need to install it (depending on your environment, package manager, etc):

```bash
npm install better-sqlite3
```

## Cli Usage

```bash
npm install zod-dbs-cli zod-dbs-sqlite better-sqlite3

npx zod-dbs --provider sqlite
```

### Provider Specific CLI Options

| Option              | Description                                                | Required |
| ------------------- | ---------------------------------------------------------- | -------- |
| `--database <path>` | Path to SQLite database file (or `:memory:` for in-memory) | `true`   |

## Programmatic Usage

```bash
npm install zod-dbs zod-dbs-sqlite better-sqlite3
```

```ts
import { generateZodSchemas } from 'zod-dbs';
import { createProvider } from 'zod-dbs-sqlite';

const provider = createProvider();

await generateZodSchemas({
  provider,
  config: {
    // See zod-dbs documentation for available options
    // Example (SQLite):
    // database: 'path/to/db.sqlite',
    // outputDir: './zod-schemas',
  },
});
```
