import { ZodDbsConnectionConfig } from 'zod-dbs-core';

import { MsSqlServerProvider } from '../../../src/MsSqlServerProvider.js';
import {
  getConnectionConfig,
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../testDbUtils.js';

let ctx: TestDbContext;
let connectionConfig: ZodDbsConnectionConfig;

beforeAll(async () => {
  ctx = await setupTestDb();
  connectionConfig = getConnectionConfig();
});

afterAll(async () => {
  await teardownTestDb(ctx);
});

it('returns raw schema column information', async () => {
  const provider = new MsSqlServerProvider();

  const info = await provider.fetchSchemaInfo(connectionConfig);

  expect(info).toBeDefined();
  expect(info).toMatchSnapshot('rawColumns');
});

it('returns schema models', async () => {
  const provider = new MsSqlServerProvider();

  const info = await provider.getSchemaInformation({
    ...connectionConfig,
    include: ['users'],
  });

  expect(info).toBeDefined();
  expect(info.tables).toBeDefined();

  const userTable = info.tables.find((t) => t.name === 'users')!;
  expect(userTable).toBeDefined();
  expect(userTable.columns).toBeDefined();
  expect(userTable.columns).toHaveLength(7);

  expect(userTable).toMatchSnapshot('userTable');
});
