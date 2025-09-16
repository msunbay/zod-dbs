# zod-dbs-mssql

Microsoft SQL Server provider for [zod-dbs](https://github.com/msunbay/zod-dbs).

## Installation

```bash
npm install zod-dbs-mssql
```

> Note: This package has a peer dependency on `mssql`. If you don't already have it, you might need to install it (depending on your environment, package manager, etc):

```bash
npm install mssql
```

## CLI Usage

```bash
npm install zod-dbs-cli zod-dbs-mssql

npx zod-dbs --provider mssql
```

### Provider Specific CLI Options

| Option                       | Description                                                          |
| ---------------------------- | -------------------------------------------------------------------- |
| `--connection-string <conn>` | Full database connection string (overrides other connection options) |
| `--host <host>`              | Database host (default: `localhost`)                                 |
| `--port <port>`              | Database server port (default: `1433`)                               |
| `--user <user>`              | Database user                                                        |
| `--password <password>`      | Database password                                                    |
| `--database <db>`            | Database name                                                        |
| `--schema-name <schema>`     | Database schema to introspect                                        |

## Programmatic Usage

```ts
import { generateZodSchemas } from 'zod-dbs';
import { createProvider } from 'zod-dbs-mssql';

const provider = createProvider();

await generateZodSchemas({
  provider,
  config: {
    // See zod-dbs documentation for available options
  },
});
```
