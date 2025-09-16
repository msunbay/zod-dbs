import { DynamoDbProvider } from 'zod-dbs-dynamodb';

import { getProviderConfig } from '../../../utils/context.js';

it('returns inferred schema column information', async () => {
  const provider = new DynamoDbProvider();
  const columns = await provider.fetchSchemaInfo(getProviderConfig());

  expect(columns).toBeDefined();
  expect(columns.length).toBeGreaterThan(0);

  const usersCols = columns.filter((c) => c.tableName === 'Users');
  expect(usersCols.length).toBeGreaterThan(0);

  const idCol = usersCols.find((c) => c.name === 'id');
  expect(idCol).toBeDefined();
  expect(idCol!.isNullable).toBe(false);

  // Clean undefined for snapshot stability
  usersCols.forEach((c) => {
    (Object.keys(c) as (keyof typeof c)[]).forEach((k) => {
      if (c[k] === undefined) delete c[k];
    });
  });

  expect(usersCols).toMatchSnapshot('usersColumns');
});

it('returns table models', async () => {
  const provider = new DynamoDbProvider();
  const info = await provider.getSchemaInformation(getProviderConfig());

  expect(info.tables.length).toBeGreaterThan(0);
  const users = info.tables.find((t) => t.name === 'Users');
  expect(users).toBeDefined();
  expect(users!.columns.length).toBeGreaterThan(0);
  expect(users).toMatchSnapshot('usersTable');
});
