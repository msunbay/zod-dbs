# zod-dbs-sqlite

SQLite provider for zod-dbs. Uses PRAGMA table_info and sqlite_master to introspect tables and views.

- Provider name: `sqlite`
- Peer dependency: `better-sqlite3`

Usage example:

```ts
import { generateZodSchemas } from 'zod-dbs';
import { createProvider } from 'zod-dbs-sqlite';

await generateZodSchemas({
  provider: createProvider(),
  database: 'path/to/db.sqlite',
  schemaName: 'main',
  outputDir: './zod-schemas',
});
```

Notes:

- SQLite typing is dynamic; mapping is based on declared types.
- Autoincrement detection is approximate (pk + integer type).
- Enum-like columns: SQLite has no native ENUM, but columns with CHECK constraints like
  `CHECK (status IN ('active','inactive'))` are detected and treated as enums during codegen.
  Quoted values are parsed from the original `CREATE TABLE` SQL. Complex expressions inside
  CHECK constraints are ignored.
