# zod-dbs-mysql

MySQL provider for [zod-dbs](https://github.com/msolvaag/zod-dbs).

## Installation

```bash
npm install zod-dbs-mysql
```

## Cli Usage

```bash
npm install zod-dbs-cli zod-dbs-mysql

npx zod-dbs --provider mysql
```

## Programmatic Usage

```ts
import { generateZodSchemas } from 'zod-dbs';
import { MySqlProvider } from 'zod-dbs-mysql';

const provider = new MySqlProvider();

await generateZodSchemas({
  provider,
  config: {
    // See zod-dbs documentation for available options
  },
});
```
