import { MsSqlServerProvider } from '../../../src/MsSqlServerProvider.js';
import { setupTestDb, teardownTestDb, TestDbContext } from '../testDbUtils.js';

let ctx: TestDbContext;

beforeAll(async () => {
  ctx = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb(ctx);
});

it('returns raw schema column information', async () => {
  const provider = new MsSqlServerProvider();

  const info = await provider.fetchSchemaInfo({
    ...ctx.client.config,
    schemaName: 'dbo',
  });

  expect(info).toBeDefined();
  expect(info).toMatchSnapshot('rawColumns');
});

it('returns schema models', async () => {
  const provider = new MsSqlServerProvider();

  const info = await provider.getSchemaInformation({
    ...ctx.client.config,
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
