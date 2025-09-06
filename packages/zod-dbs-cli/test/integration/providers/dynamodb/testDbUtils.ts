import { randomUUID } from 'node:crypto';
import { CreateTableCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { ZodDbsProviderConfig } from 'zod-dbs-core';
import { createClient, ZodDbsDynamoClient } from 'zod-dbs-dynamodb';

import { getProviderOutputDir } from '../../utils.js';

export interface TestDbContext {
  container: StartedTestContainer;
  client: ZodDbsDynamoClient;
}

export const getTestContext = () => {
  const g: any = globalThis as any;

  if (!g.__DYNAMODB_CTX__) {
    throw new Error('Test context not initialized');
  }

  return g.__DYNAMODB_CTX__ as TestDbContext;
};

export const getConnectionConfig = (): ZodDbsProviderConfig => {
  return getTestContext().client.config;
};

export async function setupTestDb(): Promise<TestDbContext> {
  // Use amazon/dynamodb-local image
  const container = await new GenericContainer('amazon/dynamodb-local:latest')
    .withExposedPorts(8000)
    .start();

  const host = container.getHost();
  const port = container.getMappedPort(8000);
  const endpoint = `http://${host}:${port}`;

  const client = await createClient({
    host,
    port,
    endpoint,
    region: 'us-east-1',
  });

  await client.connect();
  await seedTestData(client);

  return { container, client };
}

export async function teardownTestDb(ctx?: TestDbContext) {
  if (!ctx) return;
  try {
    await ctx.client.end();
  } finally {
    await ctx.container.stop();
  }
}

export const getOutputDir = (testSuite: string, subPath = ''): string =>
  getProviderOutputDir('dynamodb', testSuite, subPath);

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
}
