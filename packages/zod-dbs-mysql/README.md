# zod-dbs-mysql

MySQL provider for [zod-dbs](https://github.com/msolvaag/zod-dbs).

## Installation

```bash
npm install zod-dbs-mysql
```

> Note: This package has a peer dependency on `mysql2`. If you don't already have it, install it:

```bash
npm install mysql2
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
