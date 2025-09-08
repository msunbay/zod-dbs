import { PostgreSqlProvider } from 'zod-dbs-pg';

import { getProviderConfig } from '../../../utils/context.js';
import { removeUndefinedValues } from '../../../utils/snapshot.js';

const config = getProviderConfig();

it('returns raw schema column information', async () => {
  const provider = new PostgreSqlProvider();

  const info = await provider.fetchSchemaInfo({
    ...config,
    schemaName: 'public',
  });

  expect(info).toBeDefined();
  expect(info).toHaveLength(168);

  expect(removeUndefinedValues(info)).toMatchSnapshot('rawColumns');
});

it('returns schema models', async () => {
  const provider = new PostgreSqlProvider();

  const info = await provider.getSchemaInformation(config);

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
  const provider = new PostgreSqlProvider();

  const info = await provider.getSchemaInformation({
    ...config,
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
