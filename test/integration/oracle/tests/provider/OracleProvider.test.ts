import { OracleProvider } from 'zod-dbs-oracle';

import { getProviderConfig } from '../../../utils/context.js';

it('returns raw schema column information', async () => {
  const provider = new OracleProvider();

  const info = await provider.fetchSchemaInfo(getProviderConfig());

  expect(info).toBeDefined();
  expect(info).toHaveLength(7);
});

it('returns schema models', async () => {
  const provider = new OracleProvider();

  const info = await provider.getSchemaInformation(getProviderConfig());

  expect(info).toBeDefined();
  expect(info.tables).toBeDefined();
  expect(info.tables).toHaveLength(1);

  const userTable = info.tables.find((t) => t.name === 'users')!;
  expect(userTable).toBeDefined();
  expect(userTable.columns).toBeDefined();
  expect(userTable.columns).toHaveLength(7);

  const enumColumn = userTable.columns.find((c) => c.name === 'roles');
  expect(enumColumn?.isEnum).toBe(true);
  expect(enumColumn?.enumValues).toEqual(['admin', 'editor', 'viewer']);
});
