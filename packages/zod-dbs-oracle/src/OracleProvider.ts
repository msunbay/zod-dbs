import { sql, ZodDbsBaseProvider } from 'zod-dbs-core';

import type {
  ZodDbsColumnInfo,
  ZodDbsColumnType,
  ZodDbsProviderConfig,
  ZodDbsTableType,
} from 'zod-dbs-core';

import { createClient } from './client.js';
import { parseEnumValues } from './enums/enumConstraints.js';

interface RawColumnRow {
  TABLE_NAME: string;
  COLUMN_NAME: string;
  DATA_TYPE: string;
  NULLABLE: string;
  DATA_LENGTH: number | null;
  DATA_DEFAULT: string | null;
  COMMENTS: string | null;
  TABLE_TYPE: 'table' | 'view' | 'unknown';
  CHECK_CONSTRAINTS: string;
}

const CHECK_CONSTRAINT_SEPARATOR = ' ||| ';

const DEFAULT_CONFIGURATION = {
  port: 1521,
};

function parseCheckConstraints(raw: string): string[] {
  return raw
    .split(CHECK_CONSTRAINT_SEPARATOR)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isSerialColumn(defaultValue: string | null): boolean {
  if (!defaultValue) return false;
  return /NEXTVAL/i.test(defaultValue);
}

export class OracleProvider extends ZodDbsBaseProvider {
  constructor() {
    super({
      name: 'oracle',
      displayName: 'Oracle',
      configurationDefaults: DEFAULT_CONFIGURATION,
      options: [
        {
          name: 'host',
          type: 'string',
          description: 'Database host',
          default: 'localhost',
        },
        {
          name: 'port',
          type: 'number',
          description: 'Database port',
          default: 1521,
        },
        {
          name: 'user',
          type: 'string',
          description: 'Database user',
        },
        {
          name: 'password',
          type: 'string',
          description: 'Database password',
        },
        {
          name: 'database',
          type: 'string',
          description: 'Database service name (e.g., ORCLPDB1)',
        },
        {
          name: 'schema-name',
          type: 'string',
          description:
            'Schema name to introspect (defaults to the user name if not provided)',
        },
      ],
    });
  }

  async createClient(options: ZodDbsProviderConfig) {
    return await createClient(options);
  }

  protected override getZodType(dataType: string): ZodDbsColumnType {
    const normalizedType = dataType.toLowerCase();

    if (normalizedType.startsWith('timestamp')) {
      return 'date';
    }

    if (normalizedType.startsWith('varchar')) {
      return 'string';
    }

    return super.getZodType(dataType);
  }

  protected createColumnInfo(
    column: RawColumnRow,
    schemaName: string
  ): ZodDbsColumnInfo {
    const tableType: ZodDbsTableType = column.TABLE_TYPE ?? 'unknown';

    const enumValues = column.CHECK_CONSTRAINTS
      ? parseEnumValues(
          column.COLUMN_NAME,
          parseCheckConstraints(column.CHECK_CONSTRAINTS)
        )
      : undefined;

    return {
      name: column.COLUMN_NAME,
      schemaName,
      tableName: column.TABLE_NAME,
      tableType,
      isNullable: column.NULLABLE === 'Y',
      dataType: column.DATA_TYPE,
      maxLen: column.DATA_LENGTH ?? undefined,
      defaultValue: column.DATA_DEFAULT ?? undefined,
      description: column.COMMENTS ?? undefined,
      isEnum: enumValues ? enumValues.length > 0 : false,
      isSerial: isSerialColumn(column.DATA_DEFAULT),
      isArray: false,
      enumValues,
    };
  }

  public async fetchSchemaInfo(
    config: ZodDbsProviderConfig
  ): Promise<ZodDbsColumnInfo[]> {
    const schemaName = (config.schemaName ?? config.user ?? '').toUpperCase();

    const client = await this.createClient(config);
    await client.connect();

    try {
      const rows = await client.query<RawColumnRow[]>(
        sql`
          SELECT
            utc.TABLE_NAME,
            utc.COLUMN_NAME,
            utc.DATA_TYPE,
            utc.NULLABLE,
            utc.DATA_LENGTH,
            utc.DATA_DEFAULT,
            ucc.COMMENTS,
            CASE 
              WHEN ut.TABLE_NAME IS NOT NULL THEN 'table'
              WHEN uv.VIEW_NAME IS NOT NULL THEN 'view'
              ELSE 'unknown'
            END AS TABLE_TYPE,
            checks.CHECK_CONSTRAINTS_VC
          FROM USER_TAB_COLUMNS utc
          LEFT JOIN USER_COL_COMMENTS ucc
            ON ucc.TABLE_NAME = utc.TABLE_NAME AND ucc.COLUMN_NAME = utc.COLUMN_NAME
          LEFT JOIN USER_TABLES ut ON ut.TABLE_NAME = utc.TABLE_NAME
          LEFT JOIN USER_VIEWS uv ON uv.VIEW_NAME = utc.TABLE_NAME
          LEFT JOIN (
            SELECT
              cc.TABLE_NAME,
              cc.COLUMN_NAME,
              LISTAGG(c.SEARCH_CONDITION_VC, ' ||| ') WITHIN GROUP (ORDER BY c.CONSTRAINT_NAME) AS CHECK_CONSTRAINTS_VC
            FROM USER_CONSTRAINTS c
            JOIN USER_CONS_COLUMNS cc
              ON cc.CONSTRAINT_NAME = c.CONSTRAINT_NAME
             AND cc.TABLE_NAME = c.TABLE_NAME
            WHERE c.CONSTRAINT_TYPE = 'C'
            GROUP BY cc.TABLE_NAME, cc.COLUMN_NAME
          ) checks
            ON checks.TABLE_NAME = utc.TABLE_NAME AND checks.COLUMN_NAME = utc.COLUMN_NAME
          ORDER BY utc.TABLE_NAME, utc.COLUMN_ID
        `
      );

      return rows.map((row) => this.createColumnInfo(row, schemaName));
    } finally {
      await client.end();
    }
  }
}
