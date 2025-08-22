import { getZodType, logDebug, sql, ZodDbsBaseProvider } from 'zod-dbs-core';

import type {
  ZodDbsColumnInfo,
  ZodDbsConnectionConfig,
  ZodDbsConnectorConfig,
} from 'zod-dbs-core';

import { createClient } from './client.js';
import { parseEnumValues } from './utils.js';

interface RawColumnInfo {
  tableName: string;
  tableSchema: string;
  name: string;
  ordinalPosition: number;
  defaultValue: string | null;
  isNullable: string;
  dataType: string;
  characterMaximumLength: number | null;
  numericPrecision: number | null;
  numericScale: number | null;
  columnType: string;
  columnKey: string;
  extra: string | null;
  description: string | null;
}

/**
 * Provider to interact with MySQL database and retrieve schema information.
 * Supports MySQL version 8 and above.
 */
export class MySqlProvider extends ZodDbsBaseProvider {
  constructor() {
    super({
      name: 'mysql',
      displayName: 'MySQL',
    });
  }

  createClient = (options: ZodDbsConnectionConfig) => {
    return createClient(options);
  };

  protected createColumnInfo(column: RawColumnInfo): ZodDbsColumnInfo {
    const parsedColumn: ZodDbsColumnInfo = {
      maxLen: column.characterMaximumLength ?? undefined,
      isEnum: false,
      isSerial: false,
      isArray: false,
      isWritable: true,
      type: getZodType(column.dataType),
      schemaName: column.tableSchema,
      tableType: 'table',
      name: column.name,
      isNullable: column.isNullable === 'YES',
      dataType: column.dataType,
      tableName: column.tableName,
      defaultValue: column.defaultValue ?? undefined,
      description: column.description ?? undefined,
    };

    parsedColumn.isArray = column.dataType.toLowerCase().endsWith('[]');
    parsedColumn.isSerial = column.extra?.includes('auto_increment') ?? false;
    parsedColumn.isWritable = !parsedColumn.isSerial;
    parsedColumn.isOptional = column.isNullable === 'YES';
    parsedColumn.isEnum = column.dataType === 'enum';
    if (parsedColumn.isEnum)
      parsedColumn.enumValues = parseEnumValues(column.columnType);

    return parsedColumn;
  }

  public override async fetchSchemaInfo(
    config: ZodDbsConnectorConfig
  ): Promise<ZodDbsColumnInfo[]> {
    const { schemaName = 'public' } = config;

    config.onProgress?.('connecting');
    const client = await this.createClient(config);
    await client.connect();

    config.onProgress?.('fetchingSchema');
    logDebug(`Retrieving schema information for schema '${schemaName}'`);

    /**
     * {
    TABLE_CATALOG: 'def',
    TABLE_SCHEMA: 'test',
    TABLE_NAME: 'users',
    COLUMN_NAME: 'id',
    ORDINAL_POSITION: 1,
    COLUMN_DEFAULT: null,
    IS_NULLABLE: 'NO',
    DATA_TYPE: 'bigint',
    CHARACTER_MAXIMUM_LENGTH: null,
    CHARACTER_OCTET_LENGTH: null,
    NUMERIC_PRECISION: 20,
    NUMERIC_SCALE: 0,
    DATETIME_PRECISION: null,
    CHARACTER_SET_NAME: null,
    COLLATION_NAME: null,
    COLUMN_TYPE: 'bigint unsigned',
    COLUMN_KEY: 'PRI',
    EXTRA: 'auto_increment',
    PRIVILEGES: 'select,insert,update,references',
    COLUMN_COMMENT: '',
    GENERATION_EXPRESSION: '',
    SRS_ID: null
  },
     */
    try {
      const result = await client.query<RawColumnInfo[]>(
        sql`
          SELECT
            TABLE_NAME AS "tableName",
            TABLE_SCHEMA AS "tableSchema",
            COLUMN_NAME AS "name",
            ORDINAL_POSITION AS "ordinalPosition",
            COLUMN_DEFAULT AS "defaultValue",
            IS_NULLABLE AS "isNullable",
            DATA_TYPE AS "dataType",
            CHARACTER_MAXIMUM_LENGTH AS "characterMaximumLength",
            NUMERIC_PRECISION AS "numericPrecision",
            NUMERIC_SCALE AS "numericScale",
            COLUMN_TYPE AS "columnType",
            COLUMN_KEY AS "columnKey",
            EXTRA AS extra,
            COLUMN_COMMENT AS "description"
          FROM information_schema.columns
          WHERE TABLE_SCHEMA = ?
          ORDER BY TABLE_NAME, ORDINAL_POSITION
        `,
        [schemaName]
      );

      return result.map((column) => this.createColumnInfo(column));
    } finally {
      await client.end();
    }
  }
}
