# zod-dbs-dynamodb

DynamoDB provider for zod-dbs.

## Notes

- Requires `@aws-sdk/client-dynamodb` as a peer dependency.
- Enum types are not yet supported, but can be added to the generated schemas using hooks.
- DynamoDB is schemaless; results are heuristic.
- Key attributes forced non-nullable.
- Requires AWS credentials or a local endpoint (set endpoint for DynamoDB local).

## Installation

```bash
npm install zod-dbs-dynamodb
```

> Note: This package has a peer dependency on `@aws-sdk/client-dynamodb`. If you don't already have it, you might need to install it (depending on your environment, package manager, etc):

```bash
npm install @aws-sdk/client-dynamodb
```

## CLI Usage

```bash
npx zod-dbs --provider dynamodb --endpoint <endpoint> --sample-size <num>
```

### Provider Specific CLI Options

| Option                         | Description                                                             |
| ------------------------------ | ----------------------------------------------------------------------- |
| `--region <region>`            | AWS region for DynamoDB (default: `us-east-1`)                          |
| `--access-key-id <key>`        | AWS Access Key ID (for local or custom endpoints)                       |
| `--secret-access-key <secret>` | AWS Secret Access Key (for local or custom endpoints)                   |
| `--session-token <token>`      | AWS Session Token (for local or custom endpoints)                       |
| `--endpoint <url>`             | Override endpoint (e.g., for local DynamoDB)                            |
| `--sample-size <num>`          | Number of items to sample per table when inferring schema (default: 50) |

### Configuration File Example

```ts
import { ZodDbsCliConfig } from 'zod-dbs-cli';
import { createProvider } from 'zod-dbs-dynamodb';

const config: ZodDbsCliConfig = {
  provider: createProvider(),
  endpoint: '<endpoint>', // optional for local DynamoDB
  sampleSize: 100, // optional default is 50
};

export default config;
```

## Programmatic Usage

```ts
import { generateZodSchemas } from 'zod-dbs';
import { createProvider } from 'zod-dbs-dynamodb';

await generateZodSchemas({
  provider: createProvider(),
  config: {
    endpoint: '<endpoint>', // optional for local DynamoDB
    sampleSize: 50, // optional default is 50
  },
});
```
