import { ZodDbsConnectionConfig } from 'zod-dbs-core';

import { MySqlConnector } from '../../../src/MySqlConnector.js';
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

it.only('returns raw schema column information', async () => {
  const connector = new MySqlConnector();

  const info = await connector.fetchSchemaInfo(connectionConfig);

  expect(info).toBeDefined();
  expect(info).toHaveLength(6);
  expect(info).toMatchSnapshot('rawColumns');
});

it('returns schema models', async () => {
  const connector = new MySqlConnector();

  const info = await connector.getSchemaInformation(connectionConfig);

  expect(info).toBeDefined();
  expect(info.tables).toBeDefined();
  expect(info.tables).toHaveLength(1);

  const userTable = info.tables.find((t) => t.name === 'users')!;
  expect(userTable).toBeDefined();
  expect(userTable.columns).toBeDefined();
  expect(userTable.columns).toHaveLength(8);

  expect(userTable).toMatchSnapshot('userTable');
});
