import fs from 'node:fs/promises';
import path from 'node:path';

import type { ZodDbsDatabaseClient } from 'zod-dbs-core';

export const seedTestData = async (
  provider: string,
  client: ZodDbsDatabaseClient
) => {
  const schemaPath = path.resolve(
    import.meta.dirname,
    '../',
    provider,
    './schema.sql'
  );

  // Create schema
  const schemaSql = await fs.readFile(schemaPath, 'utf8');
  await client.query(schemaSql);
};
