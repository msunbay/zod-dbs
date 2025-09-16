import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { logDebug } from 'zod-dbs-core';

import type { ZodDbsProviderConfig } from 'zod-dbs-core';
import type { ZodDbsDynamoClient } from './types.js';

export async function createClient(
  config: ZodDbsProviderConfig
): Promise<ZodDbsDynamoClient> {
  logDebug('Creating DynamoDB client', {
    region: config.region,
    endpoint: config.endpoint,
  });

  const client = new DynamoDBClient({
    region: config.region,
    endpoint: config.endpoint,
    credentials:
      config.accessKeyId && config.secretAccessKey
        ? {
            accessKeyId: String(config.accessKeyId),
            secretAccessKey: String(config.secretAccessKey),
            sessionToken: config.sessionToken
              ? String(config.sessionToken)
              : undefined,
          }
        : undefined,
  });

  let connected = false;

  return {
    async connect() {
      if (!connected) {
        // AWS SDK is lazy; mark connected immediately.
        connected = true;
      }
    },
    async query(_stmt: string) {
      throw new Error('DynamoDB client does not support raw SQL queries');
    },
    async end() {
      connected = false;
    },
    get driver() {
      return client;
    },
  };
}
