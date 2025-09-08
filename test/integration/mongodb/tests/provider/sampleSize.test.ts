import { MongoDbProvider } from 'zod-dbs-mongodb';

import { getProviderConfig } from '../../../utils/context.js';

describe('MongoDbProvider sampling (sampleSize)', () => {
  it('larger sampleSize discovers at least as many fields as a small sample', async () => {
    const provider = new MongoDbProvider();

    const small = await provider.fetchSchemaInfo({
      ...getProviderConfig(),
      sampleSize: 1,
    } as any);

    const large = await provider.fetchSchemaInfo({
      ...getProviderConfig(),
      sampleSize: 9999,
    } as any);

    const smallEvents = small
      .filter((c) => c.tableName === 'events')
      .map((c) => c.name);
    const largeEvents = large
      .filter((c) => c.tableName === 'events')
      .map((c) => c.name);

    // Every field seen in the small sample should also be seen in the large sample.
    expect(smallEvents.every((n) => largeEvents.includes(n))).toBe(true);
    // Large sample should discover at least as many distinct fields.
    expect(largeEvents.length).toBeGreaterThanOrEqual(smallEvents.length);
  });

  it('reported columns include boolean isNullable and it is present for shared columns', async () => {
    const provider = new MongoDbProvider();

    const small = await provider.fetchSchemaInfo({
      ...getProviderConfig(),
      sampleSize: 1,
    } as any);

    const large = await provider.fetchSchemaInfo({
      ...getProviderConfig(),
      sampleSize: 9999,
    } as any);

    const smallEvents = small.filter((c) => c.tableName === 'events');
    const largeEvents = large.filter((c) => c.tableName === 'events');

    const largeByName = new Map(largeEvents.map((c) => [c.name, c]));

    // Every column has an explicit boolean isNullable in the large sample
    for (const col of largeEvents) {
      expect(typeof col.isNullable).toBe('boolean');
    }

    // For columns present in both samples, isNullable should be reported in both results and be a boolean.
    for (const col of smallEvents) {
      const match = largeByName.get(col.name);
      if (match) {
        expect(typeof col.isNullable).toBe('boolean');
        expect(typeof match.isNullable).toBe('boolean');
      }
    }
  });
});
