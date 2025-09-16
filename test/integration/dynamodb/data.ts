import { randomUUID } from 'node:crypto';
import { CreateTableCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

import type { ZodDbsDynamoClient } from 'zod-dbs-dynamodb';

export async function seedTestData(client: ZodDbsDynamoClient) {
  // Create a Users table
  await client.driver.send(
    new CreateTableCommand({
      TableName: 'Users',
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
        { AttributeName: 'sort', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'sort', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    })
  );

  // Add a few items with varying optional attributes
  for (let i = 0; i < 5; i++) {
    await client.driver.send(
      new PutItemCommand({
        TableName: 'Users',
        Item: {
          id: { S: randomUUID() },
          sort: { S: `v${i}` },
          email: { S: `user${i}@example.com` },
          profile: {
            M: {
              displayName: { S: `User ${i}` },
              age: { N: String(20 + i) },
            },
          },
          // Make 'tags' sporadic to infer optionality
          ...(i % 2 === 0
            ? { tags: { L: [{ S: 'alpha' }, { S: 'beta' }] } }
            : {}),
        },
      })
    );
  }

  // Create a Products table with numeric, set and map attributes
  await client.driver.send(
    new CreateTableCommand({
      TableName: 'Products',
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingMode: 'PAY_PER_REQUEST',
    })
  );

  // Seed some products showing N, SS, NS, BOOL, M and B types
  for (let i = 0; i < 4; i++) {
    await client.driver.send(
      new PutItemCommand({
        TableName: 'Products',
        Item: {
          id: { S: `prod-${i}` },
          name: { S: `Product ${i}` },
          price: { N: String(9.99 + i * 5) },
          inStock: { BOOL: i % 2 === 0 },
          // string set of categories
          categories: { SS: [`cat${i}`, `common`] },
          // number set example - ensure values are unique (DynamoDB rejects duplicates in sets)
          ratings: {
            NS: Array.from(new Set([String(4 + (i % 2)), String(5 + i)])),
          },
          // nested map for metadata
          metadata: {
            M: {
              sku: { S: `SKU-${1000 + i}` },
              dimensions: { M: { w: { N: '10' }, h: { N: '20' } } },
            },
          },
          // binary blob
          image: { B: Buffer.from(`image-${i}`) },
        },
      })
    );
  }

  // Create an Orders table that demonstrates lists, nulls and nested maps
  await client.driver.send(
    new CreateTableCommand({
      TableName: 'Orders',
      KeySchema: [
        { AttributeName: 'orderId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'orderId', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    })
  );

  // Seed some orders with mixed lists and nulls
  for (let i = 0; i < 3; i++) {
    await client.driver.send(
      new PutItemCommand({
        TableName: 'Orders',
        Item: {
          orderId: { S: `order-${i}` },
          createdAt: { S: new Date(Date.now() - i * 1000).toISOString() },
          total: { N: String(100 + i * 25) },
          // items is a list with maps
          items: {
            L: [
              {
                M: {
                  productId: { S: `prod-${i}` },
                  qty: { N: '1' },
                },
              },
              {
                M: {
                  productId: { S: `prod-${(i + 1) % 4}` },
                  qty: { N: '2' },
                },
              },
            ],
          },
          // nullable field: only include when explicitly null
          ...(i === 0 ? { coupon: { NULL: true } } : {}),
          // nested shipping map
          shipping: {
            M: {
              address: { S: `Street ${i}` },
              expedited: { BOOL: i === 2 },
            },
          },
        },
      })
    );
  }

  // Create a Sessions table to demonstrate binary sets (BS) and TTL attribute
  await client.driver.send(
    new CreateTableCommand({
      TableName: 'Sessions',
      KeySchema: [{ AttributeName: 'sessionId', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'sessionId', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    })
  );

  for (let i = 0; i < 3; i++) {
    await client.driver.send(
      new PutItemCommand({
        TableName: 'Sessions',
        Item: {
          sessionId: { S: `sess-${randomUUID()}` },
          userId: { S: `user-${i}` },
          // binary set of tokens
          tokens: { BS: [Buffer.from(`t-${i}-a`), Buffer.from(`t-${i}-b`)] },
          // expires is a TTL numeric timestamp
          expires: {
            N: String(Math.floor(Date.now() / 1000) + 3600 * (i + 1)),
          },
        },
      })
    );
  }
}
