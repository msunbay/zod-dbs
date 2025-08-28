import { ZodDbsDatabaseClient } from 'zod-dbs-core';

export interface ZodDbsMongoDbClient extends ZodDbsDatabaseClient {
  driver: any; // MongoClient
}

declare module 'zod-dbs-core' {
  interface ZodDbsConnectionConfig {
    replicaSet?: string;
    directConnection?: boolean;
  }
}
