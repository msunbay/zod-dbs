import { logDebug, sql, ZodDbsBaseProvider } from 'zod-dbs-core';

import type { ZodDbsColumnInfo, ZodDbsProviderConfig } from 'zod-dbs-core';

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
 * Provider to interact with Microsoft SQL Server database and retrieve schema information.
 * Supports MMSQL version x and above.
 */
export class MsSqlServerProvider extends ZodDbsBaseProvider {
  constructor() {
    super({
      name: 'mssql',
      displayName: 'Microsoft SQL Server',
      configurationDefaults: {
        port: 1433,
        schemaName: 'dbo',
      },
    });
  }

  createClient = (options: ZodDbsProviderConfig) => {
    return createClient(options);
  };

  protected createColumnInfo(column: RawColumnInfo): ZodDbsColumnInfo {
    const parsedColumn: ZodDbsColumnInfo = {
      maxLen: column.characterMaximumLength ?? undefined,
      isEnum: column.dataType === 'enum',
      isSerial: column.extra?.includes('auto_increment') ?? false,
      isArray: false,
      schemaName: column.tableSchema,
      tableType: 'table',
      name: column.name,
      isNullable: column.isNullable === 'YES',
      dataType: column.dataType,
      tableName: column.tableName,
      defaultValue: column.defaultValue ?? undefined,
      description: column.description ?? undefined,
    };

    if (parsedColumn.isEnum)
      parsedColumn.enumValues = parseEnumValues(column.columnType);

    return parsedColumn;
  }

  public override async fetchSchemaInfo(
    config: ZodDbsProviderConfig
  ): Promise<ZodDbsColumnInfo[]> {
    const { schemaName } = config;

    config.onProgress?.('connecting');
    const client = await this.createClient(config);
    await client.connect();

    config.onProgress?.('fetchingSchema');
    logDebug(`Retrieving schema information for schema '${schemaName}'`);

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
            NUMERIC_SCALE AS "numericScale"
          FROM information_schema.columns
          WHERE TABLE_SCHEMA = '${schemaName}'
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
