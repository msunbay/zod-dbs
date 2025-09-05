import { SqliteProvider } from '../../../src/SqliteProvider.js';
import { setupTestDb, teardownTestDb, TestDbContext } from '../testDbUtils.js';

let ctx: TestDbContext;

beforeAll(async () => {
  ctx = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb(ctx);
});

it('returns raw schema column information', async () => {
  const provider = new SqliteProvider();

  const info = await provider.fetchSchemaInfo(ctx.client.config);

  expect(info).toBeDefined();
  expect(info.length).toBeGreaterThan(0);
  expect(info).toMatchSnapshot('rawColumns');
});

it('returns schema models', async () => {
  const provider = new SqliteProvider();

  const info = await provider.getSchemaInformation(ctx.client.config);

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

  const info = await provider.getSchemaInformation(ctx.client.config);

  const userTable = info.tables.find((t) => t.name === 'users')!;
  const statusCol = userTable.columns.find((c) => c.name === 'status');

  expect(statusCol?.isEnum).toBe(true);
  expect(statusCol?.enumValues).toEqual(['active', 'inactive', 'banned']);
});

it('has CHECK IN constraint in sqlite_master SQL', async () => {
  const rows = (await ctx.client.query(
    'SELECT sql FROM sqlite_master WHERE type = ? AND name = ?',
    ['table', 'users']
  )) as Array<{ sql: string }>;

  const createSql = rows?.[0]?.sql ?? '';

  expect(createSql.toLowerCase()).toContain(
    "check (status in ('active','inactive','banned'))"
  );
});
