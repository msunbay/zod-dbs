# zod-dbs-mysql

MySQL provider for [zod-dbs](https://github.com/msunbay/zod-dbs).

## Installation

```bash
npm install zod-dbs-mysql
```

> Note: This package has a peer dependency on `mysql2`. If you don't already have it, you might need to install it (depending on your environment, package manager, etc):

```bash
npm install mysql2
```

## CLI Usage

```bash
npm install zod-dbs-cli zod-dbs-mysql

npx zod-dbs --provider mysql
```

### Provider Specific CLI Options

| Option                       | Description                                                          |
| ---------------------------- | -------------------------------------------------------------------- |
| `--connection-string <conn>` | Full database connection string (overrides other connection options) |
| `--host <host>`              | Database host (default: `localhost`)                                 |
| `--port <port>`              | Database server port (default: `3306`)                               |
| `--user <user>`              | Database user                                                        |
| `--password <password>`      | Database password                                                    |
| `--database <db>`            | Database name to connect to                                          |
| `--schema-name <schema>`     | Database schema name (usually same as database name, optional)       |

## Programmatic Usage

```ts
import { generateZodSchemas } from 'zod-dbs';
import { createProvider } from 'zod-dbs-mysql';

const provider = createProvider();

await generateZodSchemas({
  provider,
  config: {
    // See zod-dbs documentation for available options
  },
});
```

## Compatibility

- Works with MariaDB in addition to MySQL. The provider uses the MySQL protocol (`mysql2`) and introspects via `information_schema.columns`, which MariaDB supports.
