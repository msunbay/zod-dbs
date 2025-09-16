import { MsSqlServerProvider } from 'zod-dbs-mssql';

import { getProviderConfig } from '../../../utils/context.js';

it('returns raw schema column information', async () => {
  const provider = new MsSqlServerProvider();

  const info = await provider.fetchSchemaInfo({
    ...getProviderConfig(),
    schemaName: 'dbo',
  });

  expect(info).toBeDefined();
  expect(info).toMatchSnapshot('rawColumns');
});

it('returns schema models', async () => {
  const provider = new MsSqlServerProvider();

  const info = await provider.getSchemaInformation({
    ...getProviderConfig(),
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
