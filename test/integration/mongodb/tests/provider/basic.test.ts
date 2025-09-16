import { MongoDbProvider } from 'zod-dbs-mongodb';

import { getProviderConfig } from '../../../utils/context.js';

it('returns raw schema column information', async () => {
  const provider = new MongoDbProvider();
  const info = await provider.fetchSchemaInfo(getProviderConfig());

  expect(info).toBeDefined();
  expect(info.length).toBeGreaterThan(0);

  // Remove undefined keys for stable snapshots
  info.forEach((column) => {
    (Object.keys(column) as (keyof typeof column)[]).forEach((key) => {
      if (column[key] === undefined) delete column[key];
    });
  });

  expect(info).toMatchSnapshot('rawColumns');
});

it('returns schema models', async () => {
  const provider = new MongoDbProvider();
  const info = await provider.getSchemaInformation(getProviderConfig());

  expect(info).toBeDefined();
  expect(info.tables).toBeDefined();
  expect(info.tables.length).toBeGreaterThan(0);

  const users = info.tables.find((t) => t.name === 'users');
  expect(users).toBeDefined();
  expect(users!.columns.length).toBeGreaterThan(0);
  expect(users).toMatchSnapshot('usersTable');
});
