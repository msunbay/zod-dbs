import type { ZodDbsDatabaseClient } from 'zod-dbs-core';

export interface ZodDbsMongoDbClient extends ZodDbsDatabaseClient {
  driver: any; // MongoClient
}

declare module 'zod-dbs-core' {
  interface ZodDbsProviderConfig {
    /**
     * Optional full MongoDB connection string. If provided, this takes precedence over other connection parameters.
     */
    connectionString?: string;
    /**
     * The hostname of the MongoDB server (default: 'localhost').
     */
    host?: string;
    /**
     * The port number of the MongoDB server (default: 27017).
     */
    port?: number;
    /**
     * The name of the database to connect to (if any).
     */
    database?: string;
    /**
     * The replica set name to connect to (if any).
     */
    replicaSet?: string;
    /**
     * If true, the MongoDB driver will connect directly to the specified host/port.
     * This is useful for connecting to a standalone MongoDB instance or when using a replica set
     * with a single member.
     */
    directConnection?: boolean;
    /**
     * When sampling documents to infer schema, how many documents to sample.
     * Default: 50
     */
    sampleSize?: number;
  }
}
