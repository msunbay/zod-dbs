# zod-dbs-dynamodb

DynamoDB provider for zod-dbs.

## Notes

- Requires `@aws-sdk/client-dynamodb` as a peer dependency.
- Enum types are not yet supported, but can be added to the generated schemas using hooks.
- DynamoDB is schemaless; results are heuristic (unioned types collapse to json/any).
- Key attributes forced non-nullable.
- No deep object/array field introspection inside M/L beyond coarse type classification.
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
npx zod-dbs --provider dynamo --endpoint <endpoint> --sample-size <num>
```

### Provider Specific CLI Options

| Option          | Description                                                | Required |
| --------------- | ---------------------------------------------------------- | -------- |
| `--endpoint`    | Local endpoint                                             |          |
| `--sample-size` | Number of documents to sample per collection (default: 50) |          |

### Configuration File Example

```ts
import { ZodDbsCliConfig } from 'zod-dbs-cli';

// Import needed to load the provider specific configuration types.
import 'zod-dbs-dynamodb';

const config: ZodDbsCliConfig = {
  provider: 'dynamo',
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
