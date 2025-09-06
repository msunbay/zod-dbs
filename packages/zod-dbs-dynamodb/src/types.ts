import { ZodDbsDatabaseClient } from 'zod-dbs-core';

// Narrow driver typing lazily to avoid hard dependency in type space.
export interface ZodDbsDynamoClient extends ZodDbsDatabaseClient {
  driver: any; // DynamoDBClient
}

declare module 'zod-dbs-core' {
  interface ZodDbsProviderConfig {
    /**
     * AWS region for DynamoDB
     */
    region?: string;
    /**
     * Optional endpoint override (e.g., for local DynamoDB)
     */
    endpoint?: string;
    /**
     * When sampling items to infer schema, how many items to scan.
     * Default: 50
     */
    sampleSize?: number;

    /**
     * Explicit AWS credentials (useful for DynamoDB Local or custom endpoints).
     */
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
  }
}
