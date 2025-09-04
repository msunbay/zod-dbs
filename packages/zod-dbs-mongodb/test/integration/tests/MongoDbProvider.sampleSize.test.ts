import { ObjectId } from 'mongodb';

import type { ZodDbsProviderConfig } from 'zod-dbs-core';

import { MongoDbProvider } from '../../../src/MongoDbProvider.js';
import { getClient, getConnectionConfig } from '../testDbUtils.js';

let baseConfig: ZodDbsProviderConfig;

beforeAll(async () => {
  baseConfig = getConnectionConfig();

  const db = getClient().driver.db(baseConfig.database);

  await db.createCollection('events');
  await db.collection('events').insertMany([
    { _id: new ObjectId(), a: 1, b: 1 },
    { _id: new ObjectId(), a: 2 },
    { _id: new ObjectId(), a: 3, b: 2 },
    { _id: new ObjectId(), a: 4 },
    { _id: new ObjectId(), a: 5, b: 3 },
  ]);
});

describe('MongoDbProvider sampling (sampleSize)', () => {
  it('includes fields observed across full collection when sampleSize >= count', async () => {
    const provider = new MongoDbProvider();
    const info = await provider.fetchSchemaInfo({
      ...baseConfig,
      sampleSize: 9999, // larger than collection size to force full scan via $sample
    } as any);

    const eventsCols = info.filter((c) => c.tableName === 'events');
    const colA = eventsCols.find((c) => c.name === 'a');
    const colB = eventsCols.find((c) => c.name === 'b');

    expect(colA).toBeDefined();
    expect(colA!.isNullable).toBe(false); // 'a' present in all inserted docs

    expect(colB).toBeDefined();
    // 'b' missing in some docs -> should be nullable when sampling entire collection
    expect(colB!.isNullable).toBe(true);
  });

  it('with small sampleSize still detects always-present fields', async () => {
    const provider = new MongoDbProvider();
    const info = await provider.fetchSchemaInfo({
      ...baseConfig,
      sampleSize: 1,
    } as any);

    const eventsCols = info.filter((c) => c.tableName === 'events');
    const colA = eventsCols.find((c) => c.name === 'a');

    expect(colA).toBeDefined();
    expect(colA!.isNullable).toBe(false); // 'a' present in all docs, any sample observes it as required
  });
});
