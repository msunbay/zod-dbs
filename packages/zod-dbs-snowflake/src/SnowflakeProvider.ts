import { logDebug, sql, ZodDbsBaseProvider } from 'zod-dbs-core';

import type {
  ZodDbsColumnInfo,
  ZodDbsColumnType,
  ZodDbsProviderConfig,
  ZodDbsTableType,
} from 'zod-dbs-core';

import { createClient } from './client.js';

interface RawColumnRow {
  TABLE_NAME: string;
  COLUMN_NAME: string;
  DATA_TYPE: string;
  IS_NULLABLE: string;
  CHARACTER_MAXIMUM_LENGTH: number | null;
  NUMERIC_PRECISION: number | null;
  NUMERIC_SCALE: number | null;
  COLUMN_DEFAULT: string | null;
  COMMENT: string | null;
  TABLE_TYPE: ZodDbsTableType;
}

export class SnowflakeProvider extends ZodDbsBaseProvider {
  constructor() {
    super({
      name: 'snowflake',
      displayName: 'Snowflake',
      options: [
        {
          name: 'account',
          type: 'string',
          description:
            'Snowflake account identifier (e.g., xy12345.eu-central-1)',
          required: true,
        },
        {
          name: 'token',
          type: 'string',
          description: 'JWT token for authentication',
          required: false,
        },
        {
          name: 'role',
          type: 'string',
          description: 'Role to assume after connecting',
          required: false,
        },
        {
          name: 'warehouse',
          type: 'string',
          description: 'Virtual warehouse to use for the session',
          required: false,
        },
      ],
    });
  }

  protected async createClient(options: ZodDbsProviderConfig) {
    return await createClient(options);
  }

  protected createColumnInfo(
    row: RawColumnRow,
    schemaName?: string
  ): ZodDbsColumnInfo {
    const tableType: ZodDbsTableType = row.TABLE_TYPE ?? 'table';

    return {
      name: row.COLUMN_NAME,
      tableName: row.TABLE_NAME,
      schemaName,
      tableType,
      isNullable: row.IS_NULLABLE === 'YES',
      dataType: row.DATA_TYPE,
      maxLen: row.CHARACTER_MAXIMUM_LENGTH ?? undefined,
      defaultValue: row.COLUMN_DEFAULT ?? undefined,
      description: row.COMMENT ?? undefined,
      isEnum: false,
      isSerial: false,
      isArray: false,
    };
  }

  protected override getZodType(dataType: string): ZodDbsColumnType {
    const normalizedType = dataType.toLowerCase();

    switch (normalizedType) {
      case 'variant':
        return 'json';
      default:
        return super.getZodType(dataType);
    }
  }

  public async fetchSchemaInfo(
    config: ZodDbsProviderConfig
  ): Promise<ZodDbsColumnInfo[]> {
    const { schemaName, database } = config;
    if (!database) throw new Error('Snowflake: database is required');
    if (!schemaName) throw new Error('Snowflake: schemaName is required');

    config.onProgress?.('Creating client');
    const client = await this.createClient(config);

    config.onProgress?.('Connecting');
    await client.connect();

    config.onProgress?.('Retrieving schema information');
    logDebug(`Retrieving schema information for ${database}.${schemaName}`);

    try {
      // Query information_schema for columns; filter to views and tables
      const rows = await client.query<RawColumnRow[]>(
        sql`
          SELECT
            c.TABLE_NAME,
            c.COLUMN_NAME,
            c.DATA_TYPE,
            c.IS_NULLABLE,
            c.CHARACTER_MAXIMUM_LENGTH,
            c.NUMERIC_PRECISION,
            c.NUMERIC_SCALE,
            c.COLUMN_DEFAULT,
            c.COMMENT,
            CASE WHEN t.TABLE_TYPE IN ('VIEW') THEN 'view' ELSE 'table' END AS TABLE_TYPE
          FROM INFORMATION_SCHEMA.COLUMNS c
          JOIN INFORMATION_SCHEMA.TABLES t
            ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME
          WHERE c.TABLE_SCHEMA = ?
            AND c.TABLE_CATALOG = ?
          ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION
        `,
        [schemaName, database]
      );

      config.onProgress?.('Processing schema information');

      return rows.map((r) => this.createColumnInfo(r, schemaName));
    } finally {
      await client.end();
    }
  }
}
