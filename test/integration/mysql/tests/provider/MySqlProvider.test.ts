import { MySqlProvider } from 'zod-dbs-mysql';

import { getProviderConfig } from '../../../utils/context.js';

const connectionConfig = getProviderConfig();

it('returns raw schema column information', async () => {
  const provider = new MySqlProvider();

  const info = await provider.fetchSchemaInfo({
    ...connectionConfig,
    schemaName: connectionConfig.database!,
  });

  expect(info).toBeDefined();
  expect(info).toHaveLength(7);
  expect(info).toMatchSnapshot('rawColumns');
});

it('returns schema models', async () => {
  const provider = new MySqlProvider();

  const info = await provider.getSchemaInformation(connectionConfig);

  expect(info).toBeDefined();
  expect(info.tables).toBeDefined();
  expect(info.tables).toHaveLength(1);

  const userTable = info.tables.find((t) => t.name === 'users')!;
  expect(userTable).toBeDefined();
  expect(userTable.columns).toBeDefined();
  expect(userTable.columns).toHaveLength(7);

  expect(userTable).toMatchSnapshot('userTable');
});

it('throws if schemaName and database is missing', async () => {
  const provider = new MySqlProvider();

  await expect(
    provider.fetchSchemaInfo({
      ...connectionConfig,
      database: undefined,
      schemaName: undefined,
    })
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: MySQL provider requires a database/schema name to fetch schema information.]`
  );
});
