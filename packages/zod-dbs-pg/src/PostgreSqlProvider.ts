import { getZodType, logDebug, sql, ZodDbsBaseProvider } from 'zod-dbs-core';

import type {
  ZodDbsColumnInfo,
  ZodDbsConnectionConfig,
  ZodDbsConnectorConfig,
  ZodDbsTableType,
} from 'zod-dbs-core';

import { createClient } from './client.js';
import { getEnumConstraints } from './enumConstraints.js';
import { isArrayType, isSerialType } from './utils.js';

interface RawColumnInfo {
  name: string;
  defaultValue: string | null;
  isNullable: boolean;
  maxLen: number | null;
  dataType: string;
  tableName: string;
  tableType: ZodDbsTableType;
  description: string | null;
  checkConstraints:
    | {
        checkClause: string;
      }[]
    | null;
}

/**
 * Provider to interact with PostgreSQL database and retrieve schema information.
 * Supports PostgreSQL version 9.3 and above.
 */
export class PostgreSqlProvider extends ZodDbsBaseProvider {
  constructor() {
    super({
      name: 'pg',
      displayName: 'PostgreSQL',
    });
  }

  async createClient(options: ZodDbsConnectionConfig) {
    return await createClient(options);
  }

  protected createColumnInfo(
    column: RawColumnInfo,
    schemaName: string
  ): ZodDbsColumnInfo {
    const parsedColumn: ZodDbsColumnInfo = {
      maxLen: column.maxLen ?? undefined,
      isEnum: false,
      isSerial: isSerialType(column.dataType, column.defaultValue),
      isArray: isArrayType(column.dataType),
      isWritable: true,
      type: getZodType(column.dataType),
      schemaName,
      name: column.name,
      isNullable: column.isNullable,
      dataType: column.dataType,
      tableName: column.tableName,
      defaultValue: column.defaultValue ?? undefined,
      description: column.description ?? undefined,
      tableType: column.tableType,
    };

    if (column.checkConstraints) {
      parsedColumn.enumValues = getEnumConstraints(
        column.name,
        column.checkConstraints.map((c) => c.checkClause)
      );

      logDebug(
        `Extracted enum values for column '${column.tableName}.${column.name}': ${JSON.stringify(parsedColumn.enumValues)}`
      );
    }

    parsedColumn.isWritable =
      !parsedColumn.isSerial && parsedColumn.tableType === 'table';
    parsedColumn.isOptional = parsedColumn.isNullable;
    parsedColumn.isEnum = !!parsedColumn.enumValues?.length;

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

    try {
      const res = await client.query<RawColumnInfo[]>(
        sql`
          SELECT
            c.relname AS "tableName",
            a.attname AS "name",
            pg_get_expr(d.adbin, d.adrelid) AS "defaultValue",
            t.typname AS "dataType",
            NOT a.attnotnull AS "isNullable",
            CASE 
              WHEN a.atttypmod > 0 THEN a.atttypmod - 4
              ELSE NULL
            END AS "maxLen",
            t.typname AS "dataType",
            checks."checkConstraints",
            col_description(c.oid, a.attnum) AS "description",
            CASE 
              WHEN c.relkind = 'r' THEN 'table'
              WHEN c.relkind = 'v' THEN 'view'
              WHEN c.relkind = 'm' THEN 'materialized_view'
              WHEN c.relkind = 'f' THEN 'foreign_table'
              ELSE 'unknown'
            END AS "tableType"
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          JOIN pg_attribute a ON a.attrelid = c.oid
          JOIN pg_type t ON t.oid = a.atttypid
          LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
          LEFT JOIN LATERAL (
            SELECT json_agg(json_build_object('checkClause', pg_get_constraintdef(pgc.oid))) AS "checkConstraints"
            FROM pg_constraint pgc
            WHERE pgc.conrelid = c.oid
              AND pgc.contype = 'c'
              AND pgc.conkey @> ARRAY[a.attnum]
          ) AS checks ON TRUE
          WHERE n.nspname = $1
            AND c.relkind IN ('r', 'v', 'm', 'f')
            AND a.attnum > 0
            AND NOT a.attisdropped
          ORDER BY c.relname, a.attnum;
        `,
        [schemaName]
      );

      logDebug(`Retrieved ${res.length} columns from schema '${schemaName}'`);

      return res.map((row) => this.createColumnInfo(row, schemaName));
    } finally {
      await client.end();
    }
  }
}
