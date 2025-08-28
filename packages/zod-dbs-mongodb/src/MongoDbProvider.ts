import { logDebug, ZodDbsBaseProvider } from 'zod-dbs-core';

import type {
  ZodDbsColumnInfo,
  ZodDbsConnectionConfig,
  ZodDbsProvider,
  ZodDbsProviderConfig,
  ZodDbsTableType,
} from 'zod-dbs-core';

import { createClient } from './client.js';

type CollectionInfo = {
  name: string;
  type?: 'collection' | 'view';
  options?: { validator?: { $jsonSchema?: any } };
};

export class MongoDbProvider
  extends ZodDbsBaseProvider
  implements ZodDbsProvider
{
  constructor() {
    super({
      name: 'mongodb',
      displayName: 'MongoDB',
      defaultConfiguration: {
        port: 27017,
        host: 'localhost',
      },
      options: [
        {
          name: 'sample-size',
          type: 'number',
          description:
            'Number of documents to sample per collection when no validator exists',
          default: 50,
        },
      ],
    });
  }

  createClient = (options: ZodDbsConnectionConfig) => createClient(options);

  protected getZodType(dataType: string) {
    const t = (dataType || '').toLowerCase();
    if (t === 'objectid' || t === 'uuid') return 'string';
    if (t === 'date') return 'date';
    if (t === 'bool' || t === 'boolean') return 'boolean';
    if (t === 'int' || t === 'int32' || t === 'int64' || t === 'long')
      return 'int';
    if (
      t === 'double' ||
      t === 'decimal' ||
      t === 'decimal128' ||
      t === 'number'
    )
      return 'number';
    if (t === 'string') return 'string';
    if (t === 'array' || t === 'object' || t === 'document' || t === 'json')
      return 'json';
    return super.getZodType(dataType);
  }

  protected createColumnInfo(args: {
    collection: string;
    schemaName?: string;
    name: string;
    bsonType?: string | string[];
    required?: boolean;
    description?: string;
    isArray?: boolean;
  }): ZodDbsColumnInfo {
    const {
      collection,
      schemaName,
      name,
      bsonType,
      required,
      description,
      isArray,
    } = args;

    const bt = Array.isArray(bsonType)
      ? bsonType.map((t) => `${t}`).join('|')
      : bsonType || 'any';
    const dt = isArray ? 'array' : bt.toLowerCase();
    const isNullable = required ? false : true; // default to optional unless explicitly required

    return {
      name,
      defaultValue: undefined,
      isNullable,
      maxLen: undefined,
      minLen: undefined,
      dataType: dt,
      tableName: collection,
      schemaName,
      description,
      tableType: 'table',
      enumValues: undefined,
      isEnum: false,
      isSerial: false,
      isArray: !!isArray,
    };
  }

  public async fetchSchemaInfo(
    config: ZodDbsProviderConfig
  ): Promise<ZodDbsColumnInfo[]> {
    const database = config.database;
    if (!database) throw new Error('MongoDB: database is required');

    const client = await this.createClient(config);
    await client.connect();

    try {
      const driver = client.driver;
      const db = driver.db(database);

      logDebug(`Retrieving MongoDB collections for database '${database}'`);
      const collections: CollectionInfo[] = await db
        .listCollections({}, { nameOnly: false })
        .toArray();

      const columns: ZodDbsColumnInfo[] = [];

      for (const coll of collections) {
        const tableType: ZodDbsTableType =
          coll.type === 'view' ? 'view' : 'table';

        // Prefer $jsonSchema from validator if present
        const schema = coll.options?.validator?.$jsonSchema;
        const requiredSet = new Set<string>(schema?.required || []);

        if (schema?.properties && typeof schema.properties === 'object') {
          for (const [field, def] of Object.entries<any>(schema.properties)) {
            const bsonType = def?.bsonType ?? def?.type;
            const isArray = (
              Array.isArray(bsonType) ? bsonType : [bsonType]
            ).some((t) => String(t).toLowerCase() === 'array');

            const info = this.createColumnInfo({
              collection: coll.name,
              schemaName: database,
              name: field,
              bsonType: isArray ? (def?.items?.bsonType ?? 'array') : bsonType,
              required: requiredSet.has(field),
              description: def?.description,
              isArray,
            });
            info.tableType = tableType;
            columns.push(info);
          }
          continue;
        }

        // Fallback: sample documents to infer fields
        const sampleSize = Number((config as any).sampleSize ?? 50);
        const cursor = db
          .collection(coll.name)
          .aggregate([{ $sample: { size: sampleSize } }]);
        const docs: any[] = await cursor.toArray();
        const fieldStats = new Map<
          string,
          { seen: number; nulls: number; types: Set<string>; arrays: boolean }
        >();

        const detectType = (v: any): string => {
          if (v === null || v === undefined) return 'null';
          if (Array.isArray(v)) return 'array';
          const t = typeof v;
          if (t === 'string') return 'string';
          if (t === 'boolean') return 'boolean';
          if (t === 'number') return Number.isInteger(v) ? 'int' : 'number';
          if (v && typeof v === 'object') {
            // Rough checks for BSON types
            const tag = v?._bsontype;
            if (tag === 'ObjectId') return 'objectid';
            if (tag === 'Decimal128') return 'decimal128';
            if (v instanceof Date) return 'date';
            return 'object';
          }
          return 'any';
        };

        for (const doc of docs) {
          if (!doc || typeof doc !== 'object') continue;
          for (const [k, v] of Object.entries(doc)) {
            const stat = fieldStats.get(k) || {
              seen: 0,
              nulls: 0,
              types: new Set<string>(),
              arrays: false,
            };
            stat.seen++;
            const ty = detectType(v);
            stat.types.add(ty);
            if (ty === 'null') stat.nulls++;
            if (ty === 'array') stat.arrays = true;
            fieldStats.set(k, stat);
          }
        }

        for (const [field, stat] of fieldStats.entries()) {
          const required = stat.seen === docs.length && stat.nulls === 0;
          const isArray = stat.arrays;
          let dataType: string = 'any';
          if (stat.types.size === 1) dataType = Array.from(stat.types)[0];
          else if (stat.types.size > 1) dataType = 'json';

          const info = this.createColumnInfo({
            collection: coll.name,
            schemaName: database,
            name: field,
            bsonType: dataType,
            required,
            isArray,
          });
          info.tableType = tableType;
          columns.push(info);
        }
      }

      return columns;
    } finally {
      await client.end();
    }
  }
}
