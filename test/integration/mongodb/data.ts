import type { ZodDbsMongoDbClient } from 'zod-dbs-mongodb';

export const seedTestData = async (
  client: ZodDbsMongoDbClient,
  database: string
) => {
  const db = client.driver.db(database);

  // Seed: create a collection with validator
  await db.createCollection('users', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'email', 'createdAt'],
        properties: {
          _id: { bsonType: 'objectId' },
          email: { bsonType: 'string' },
          createdAt: { bsonType: 'date' },
          profile: {
            bsonType: 'object',
            properties: {
              displayName: { bsonType: 'string' },
              age: { bsonType: 'int' },
            },
          },
          tags: { bsonType: 'array', items: { bsonType: 'string' } },
        },
      },
    },
  });
};
