# zod-dbs

A library for generating Zod schemas from database schemas.

Read the full documentation for usage details using the cli which wraps this library.
https://github.com/msolvaag/zod-dbs

## Installation

```bash
npm install zod-dbs zod-dbs-[provider]
```

## Usage

```ts
import { generateZodSchemas } from 'zod-dbs';
import { createProvider } from 'zod-dbs-[provider]';

await generateZodSchemas({
  provider: createProvider(),
  config: {
    // See the root zod-dbs documentation for available options
  },
});
```
