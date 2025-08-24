import { ZodDbsConnectionConfig } from 'zod-dbs-core';

import { PostgreSqlProvider } from '../../../src/PostgreSqlProvider.js';
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
  const connector = new PostgreSqlProvider();

  const info = await connector.fetchSchemaInfo(connectionOptions);

  expect(info).toBeDefined();
  expect(info).toHaveLength(168);

  // remove undefined keys
  info.forEach((column) => {
    (Object.keys(column) as (keyof typeof column)[]).forEach((key) => {
      if (column[key] === undefined) {
        delete column[key];
      }
    });
  });

  expect(info).toMatchSnapshot('rawColumns');
});

it('returns schema models', async () => {
  const connector = new PostgreSqlProvider();

  const info = await connector.getSchemaInformation(connectionOptions);

  expect(info).toBeDefined();
  expect(info.tables).toBeDefined();
  expect(info.tables).toHaveLength(19);

  const userTable = info.tables.find((t) => t.name === 'users')!;
  expect(userTable).toBeDefined();
  expect(userTable.columns).toBeDefined();
  expect(userTable.columns).toHaveLength(8);

  expect(userTable).toMatchSnapshot('userTable');
});

it('supports enum column type', async () => {
  const connector = new PostgreSqlProvider();

  const info = await connector.getSchemaInformation({
    ...connectionOptions,
    include: ['orders'],
  });

  const table = info.tables.find((t) => t.name === 'orders')!;
  expect(table).toBeDefined();

  const enumCol = table.columns.find((column) => column.name === 'status')!;

  expect(enumCol).toBeDefined();
  expect(enumCol.isEnum).toBe(true);
  expect(enumCol.enumValues).toEqual([
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ]);
});
