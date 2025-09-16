import { SqliteProvider } from 'zod-dbs-sqlite';

import { getProviderConfig } from '../../../utils/context.js';

it('returns raw schema column information', async () => {
  const provider = new SqliteProvider();

  const info = await provider.fetchSchemaInfo(getProviderConfig());

  expect(info).toBeDefined();
  expect(info.length).toBeGreaterThan(0);
  expect(info).toMatchSnapshot('rawColumns');
});

it('returns schema models', async () => {
  const provider = new SqliteProvider();

  const info = await provider.getSchemaInformation(getProviderConfig());

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

  const info = await provider.getSchemaInformation(getProviderConfig());

  const userTable = info.tables.find((t) => t.name === 'users')!;
  const statusCol = userTable.columns.find((c) => c.name === 'status');

  expect(statusCol?.isEnum).toBe(true);
  expect(statusCol?.enumValues).toEqual(['active', 'inactive', 'banned']);
});
