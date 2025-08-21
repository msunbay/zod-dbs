import { ZodDbsConnectionConfig } from 'zod-dbs-core';

import { PostgreSqlConnector } from '../../../src/PostgreSqlConnector.js';
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
  const connector = new PostgreSqlConnector();

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
  const connector = new PostgreSqlConnector();

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
