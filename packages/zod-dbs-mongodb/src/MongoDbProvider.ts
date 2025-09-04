import { logDebug, ZodDbsBaseProvider } from 'zod-dbs-core';

import type {
  ZodDbsColumn,
  ZodDbsColumnInfo,
  ZodDbsProvider,
  ZodDbsProviderConfig,
  ZodDbsTable,
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
      configurationDefaults: {
        port: 27017,
        host: 'localhost',
      },
      configurationOverrides: {
        defaultNullsToUndefined: false,
        stringifyJson: false,
      },
      options: [
        {
          name: 'host',
          type: 'string',
          description: 'MongoDB host',
          default: 'localhost',
        },
        {
          name: 'port',
          type: 'number',
          description: 'MongoDB port',
          default: 27017,
        },
        {
          name: 'database',
          type: 'string',
          description: 'MongoDB database name',
          required: true,
        },
        {
          name: 'sample-size',
          type: 'number',
          description:
            'Number of documents to sample per collection when no validator exists',
          default: 50,
        },
        {
          name: 'direct-connection',
          type: 'boolean',
          description:
            'Connect directly to the specified MongoDB host without topology discovery (useful with single-node replica sets)',
        },
        {
          name: 'replica-set',
          type: 'string',
          description: 'Replica set name for MongoDB connections',
        },
      ],
    });
  }

  createClient = (options: ZodDbsProviderConfig) => createClient(options);

  protected createColumnInfo(args: {
    collection: string;
    schemaName?: string;
    name: string;
    bsonType?: string | string[];
    required?: boolean;
    description?: string;
    isArray?: boolean;
    objectDefinition?: ZodDbsTable;
  }): ZodDbsColumnInfo {
    const {
      collection,
      schemaName,
      name,
      bsonType,
      required,
      description,
      isArray,
      objectDefinition,
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
      objectDefinition,
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

            // If the field is an object (or array of objects), collect a shallow object definition (as array)
            let objectFields: ZodDbsColumn[] | undefined;

            if (
              !isArray &&
              String(bsonType).toLowerCase() === 'object' &&
              def?.properties
            ) {
              const requiredChildren = new Set<string>(def?.required || []);

              objectFields = Object.entries<any>(def.properties).map(
                ([k, v]) => {
                  const childBsonType = v?.bsonType ?? v?.type;

                  const childIsArray = (
                    Array.isArray(childBsonType)
                      ? childBsonType
                      : [childBsonType]
                  ).some((t: any) => String(t).toLowerCase() === 'array');

                  const childBaseType = childIsArray
                    ? (v?.items?.bsonType ?? v?.items?.type ?? 'any')
                    : childBsonType;

                  const childDataType = String(
                    childIsArray ? 'array' : childBaseType || 'any'
                  ).toLowerCase();

                  return {
                    name: k,
                    defaultValue: undefined,
                    isNullable: false,
                    maxLen: undefined,
                    minLen: undefined,
                    dataType: childDataType,
                    type: this.getZodType(childBaseType),
                    description: v?.description,
                    enumValues: undefined,
                    isEnum: false,
                    isArray: !!childIsArray,
                    isWritable: true,
                    isReadOptional: !requiredChildren.has(k),
                    isWriteOptional: !requiredChildren.has(k),
                    tableName: coll.name,
                    tableType: 'table',
                    isSerial: false,
                  };
                }
              );
            } else if (isArray) {
              const itemType = def?.items?.bsonType ?? def?.items?.type;

              if (
                String(itemType).toLowerCase() === 'object' &&
                def?.items?.properties
              ) {
                const requiredChildren = new Set<string>(
                  def?.items?.required || []
                );

                objectFields = Object.entries<any>(def.items.properties).map(
                  ([k, v]) => {
                    const childBsonType = v?.bsonType ?? v?.type;

                    const childIsArray = (
                      Array.isArray(childBsonType)
                        ? childBsonType
                        : [childBsonType]
                    ).some((t: any) => String(t).toLowerCase() === 'array');

                    const childBaseType = childIsArray
                      ? (v?.items?.bsonType ?? v?.items?.type ?? 'any')
                      : childBsonType;

                    const childDataType = String(
                      childIsArray ? 'array' : childBaseType || 'any'
                    ).toLowerCase();

                    return {
                      name: k,
                      defaultValue: undefined,
                      isNullable: !requiredChildren.has(k),
                      maxLen: undefined,
                      minLen: undefined,
                      dataType: childDataType,
                      type: this.getZodType(childBaseType),
                      description: v?.description,
                      enumValues: undefined,
                      isEnum: false,
                      isArray: !!childIsArray,
                      isWritable: true,
                      isReadOptional: !requiredChildren.has(k),
                      isWriteOptional: !requiredChildren.has(k),
                      tableName: coll.name,
                      tableType: 'table',
                      isSerial: false,
                    };
                  }
                );
              }
            }

            const info = this.createColumnInfo({
              collection: coll.name,
              schemaName: database,
              name: field,
              bsonType: isArray ? (def?.items?.bsonType ?? 'array') : bsonType,
              required: requiredSet.has(field),
              description: def?.description,
              isArray,
              objectDefinition: objectFields
                ? {
                    name: `${coll.name}.${field}`,
                    type: 'object',
                    columns: objectFields,
                  }
                : undefined,
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
