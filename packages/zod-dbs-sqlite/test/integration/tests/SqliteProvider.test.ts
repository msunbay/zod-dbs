import { ZodDbsConnectionConfig } from 'zod-dbs-core';

import { SqliteProvider } from '../../../src/SqliteProvider.js';
import {
  getClient,
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
  const provider = new SqliteProvider();

  const info = await provider.fetchSchemaInfo(connectionConfig);

  expect(info).toBeDefined();
  expect(info.length).toBeGreaterThan(0);
  expect(info).toMatchSnapshot('rawColumns');
});

it('returns schema models', async () => {
  const provider = new SqliteProvider();

  const info = await provider.getSchemaInformation(connectionConfig);

  expect(info).toBeDefined();
  expect(info.tables).toBeDefined();
  const userTable = info.tables.find((t) => t.name === 'users')!;
  expect(userTable).toBeDefined();
  expect(userTable.columns).toBeDefined();
  expect(userTable.columns.length).toBeGreaterThan(0);
  expect(userTable).toMatchSnapshot('userTable');
});

it('detects enum-like columns via CHECK IN constraints', async () => {
  const provider = new SqliteProvider();

  const info = await provider.getSchemaInformation(connectionConfig);

  const userTable = info.tables.find((t) => t.name === 'users')!;
  const statusCol = userTable.columns.find((c) => c.name === 'status');

  expect(statusCol?.isEnum).toBe(true);
  expect(statusCol?.enumValues).toEqual(['active', 'inactive', 'banned']);
});

it('has CHECK IN constraint in sqlite_master SQL', async () => {
  const client = getClient();
  const rows = (await client.query(
    'SELECT sql FROM sqlite_master WHERE type = ? AND name = ?',
    ['table', 'users']
  )) as Array<{ sql: string }>;
  const createSql = rows?.[0]?.sql ?? '';
  expect(createSql.toLowerCase()).toContain(
    "check (status in ('active','inactive','banned'))"
  );
});
