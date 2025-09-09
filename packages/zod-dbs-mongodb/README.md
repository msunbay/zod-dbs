# zod-dbs-mongodb

MongoDB provider for zod-dbs.

## Notes

- Requires `mongodb` as a peer dependency.
- Enum types are not yet supported, but can be added to the generated schemas using hooks.

## Installation

```bash
npm install zod-dbs-mongodb
```

> Note: This package has a peer dependency on `mongodb`. If you don't already have it, you might need to install it (depending on your environment, package manager, etc):

```bash
npm install mongodb
```

## CLI Usage

```bash
npx zod-dbs --provider mongodb \
  --host <host> \
  --user <user> --password <password> \
  --database <db>
```

### Provider Specific CLI Options

| Option                       | Description                                                          | Required |
| ---------------------------- | -------------------------------------------------------------------- | -------- |
| `--connection-string <conn>` | Full database connection string (overrides other connection options) |          |
| `--host <host>`              | MongoDB host (default: `localhost`)                                  |          |
| `--port <port>`              | MongoDB port (default: `27017`)                                      |          |
| `--database <db>`            | MongoDB database name                                                |          |
| `--sample-size <num>`        | Number of documents to sample per collection (default: 50)           |          |
| `--direct-connection`        | Use a direct connection (if needed)                                  |          |
| `--replica-set <name>`       | Name of the replica set (if any)                                     |          |

### Configuration File Example

```ts
import { ZodDbsCliConfig } from 'zod-dbs-cli';

// Import needed to load the provider specific configuration types.
import 'zod-dbs-mongodb';

const config: ZodDbsCliConfig = {
  provider: 'mongodb',
  replicaSet: '<replicaSet>', // optional
  directConnection: true, // optional
  sampleSize: 100, // optional default is 50
};

export default config;
```

## Programmatic Usage

```ts
import { generateZodSchemas } from 'zod-dbs';
import { createProvider } from 'zod-dbs-mongodb';

await generateZodSchemas({
  provider: createProvider(),
  config: {
    host: '<host>',
    user: '<user>',
    password: '<password>',
    token: '<token>',
    database: '<db>',
    replicaSet: '<replicaSet>', // optional
    directConnection: true, // optional,
    sampleSize: 50, // optional
  },
});
```
