import { PostgreSqlConnector } from '../../../src/PostgreSqlConnector.js';
import {
  getClientConnectionString,
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../testDbUtils.js';

let ctx: TestDbContext;

beforeAll(async () => {
  ctx = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb(ctx);
});

it('returns schema information', async () => {
  const connector = new PostgreSqlConnector();

  const info = await connector.getSchemaInformation({
    connectionString: getClientConnectionString(),
  });

  expect(info).toBeDefined();
  expect(info.tables).toBeDefined();
  expect(info.tables).toHaveLength(19);

  const userTable = info.tables.find((t) => t.name === 'users')!;
  expect(userTable).toBeDefined();
  expect(userTable.columns).toBeDefined();
  expect(userTable.columns).toHaveLength(8);

  expect(userTable).toMatchSnapshot('userTable');
});
