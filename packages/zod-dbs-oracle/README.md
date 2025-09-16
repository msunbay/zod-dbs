# zod-dbs-oracle

Oracle provider for zod-dbs. Experimental.

## Installation

```bash
npm install zod-dbs-oracle
```

> Note: This package has a peer dependency on `oracledb`. If you don't already have it, you might need to install it (depending on your environment, package manager, etc):

```bash
npm install oracledb
```

## Cli Usage

```bash
npm install zod-dbs-cli zod-dbs-oracle

npx zod-dbs --provider oracle
```

### Provider Specific CLI Options

| Option                       | Description                                                          | Required |
| ---------------------------- | -------------------------------------------------------------------- | -------- |
| `--connection-string <conn>` | Full database connection string (overrides other connection options) |          |
| `--host <host>`              | Database host (default: `localhost`)                                 |          |
| `--port <port>`              | Database port (default: `1521`)                                      |          |
| `--user <user>`              | Database user                                                        |          |
| `--password <password>`      | Database password                                                    |          |
| `--database <service>`       | Database service name (e.g., ORCLPDB1)                               |          |
| `--schema-name <schema>`     | Schema name to introspect (defaults to user if not provided)         |          |

## Programmatic Usage

```ts
import { generateZodSchemas } from 'zod-dbs';
import { createProvider } from 'zod-dbs-oracle';

const provider = createProvider();

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
