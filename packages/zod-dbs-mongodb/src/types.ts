import { ZodDbsDatabaseClient } from 'zod-dbs-core';

export interface ZodDbsMongoDbClient extends ZodDbsDatabaseClient {
  driver: any; // MongoClient
}
