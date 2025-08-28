import type { ZodDbsConnectionConfig } from 'zod-dbs-core';

import { MongoDbProvider } from '../../../src/MongoDbProvider.js';
import {
  getConnectionConfig,
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../testDbUtils.js';

let ctx: TestDbContext;
let connectionOptions: ZodDbsConnectionConfig;

beforeAll(async () => {
  ctx = await setupTestDb();
  connectionOptions = getConnectionConfig();
});

afterAll(async () => {
  await teardownTestDb(ctx);
});

it('returns raw schema column information', async () => {
  const provider = new MongoDbProvider();
  const info = await provider.fetchSchemaInfo(connectionOptions);

  expect(info).toBeDefined();
  expect(info.length).toBeGreaterThan(0);

  // Remove undefined keys for stable snapshots
  info.forEach((column) => {
    (Object.keys(column) as (keyof typeof column)[]).forEach((key) => {
      if (column[key] === undefined) delete column[key];
    });
  });

  expect(info).toMatchSnapshot('rawColumns');
});

it('returns schema models', async () => {
  const provider = new MongoDbProvider();
  const info = await provider.getSchemaInformation(connectionOptions);

  expect(info).toBeDefined();
  expect(info.tables).toBeDefined();
  expect(info.tables.length).toBeGreaterThan(0);

  const users = info.tables.find((t) => t.name === 'users');
  expect(users).toBeDefined();
  expect(users!.columns.length).toBeGreaterThan(0);
  expect(users).toMatchSnapshot('usersTable');
});
