import { DatabaseConnector, logDebug, sql } from 'zod-dbs-core';

import type {
  ZodDbsConnectionConfig,
  ZodDbsConnectorConfig,
  ZodDbsRawColumnInfo,
} from 'zod-dbs-core';

import { createClient } from './client.js';

interface RawColumnInfo {
  tableName: string;
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
  extra: string;
  description: string;
}

/**
 * Default connector to interact with MySQL database and retrieve schema information.
 * Supports MySQL version x and above.
 */
export class MySqlConnector extends DatabaseConnector {
  createClient = (options: ZodDbsConnectionConfig) => {
    return createClient(options);
  };

  public override async fetchSchemaInfo(
    config: ZodDbsConnectorConfig
  ): Promise<ZodDbsRawColumnInfo[]> {
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
        `,
        [schemaName]
      );

      return result.map(
        (row): ZodDbsRawColumnInfo => ({
          tableName: row.tableName,
          name: row.name,
          isNullable: row.isNullable === 'YES',
          dataType: row.dataType,
          defaultValue: row.defaultValue,
          maxLen: row.characterMaximumLength ?? null,
          schemaName,
          tableType: 'table',
        })
      );
    } finally {
      await client.end();
    }
  }
}
