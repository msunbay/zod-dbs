import { logDebug, sql, ZodDbsBaseProvider } from 'zod-dbs-core';

import type {
  ZodDbsColumnInfo,
  ZodDbsConfig,
  ZodDbsProviderConfig,
  ZodDbsTableType,
} from 'zod-dbs-core';

import { createClient } from './client.js';

interface RawTableRow {
  name: string;
  type: 'table' | 'view';
}

interface RawColumnRow {
  cid: number;
  name: string;
  type: string | null;
  notnull: 0 | 1;
  dflt_value: string | null;
  pk: 0 | 1;
}

const DEFAULT_CONFIGURATION: ZodDbsConfig = {
  database: ':memory:',
  schemaName: 'main',
};

const parseMaxLen = (declType: string | null): number | undefined => {
  if (!declType) return undefined;
  const m = declType.match(/\((\d+)\)/);
  if (!m) return undefined;
  const v = parseInt(m[1], 10);
  return Number.isFinite(v) ? v : undefined;
};

// Extract enum-like constraints from a CREATE TABLE SQL by scanning
// CHECK (<ident> IN ('a','b', ...)) occurrences. Returns { columnName -> values[] }.
const extractEnumMapFromCreateSql = (
  createSql: string | null | undefined
): Record<string, string[]> => {
  if (!createSql) return {};

  const enumMap: Record<string, string[]> = {};
  const sql = createSql;

  // Directly match CHECK (<ident> IN (...)) ignoring whitespace/case; tolerate extra parens
  const directRegex =
    /CHECK\s*\(\s*\(?\s*([`"\[]?[A-Za-z_][A-Za-z0-9_\$]*[`"\]]?)\s+IN\s*\(([^\)]*)\)\s*\)?\s*\)/gi;
  let m: RegExpExecArray | null;
  while ((m = directRegex.exec(sql)) !== null) {
    const rawIdent = m[1];
    const listBody = m[2];

    const ident = rawIdent
      .replace(/^[`"\[]/, '')
      .replace(/[`"\]]$/, '')
      .toLowerCase();

    const valueRegex = /'((?:''|[^'])*)'/g;
    const values: string[] = [];
    let v: RegExpExecArray | null;
    while ((v = valueRegex.exec(listBody)) !== null) {
      values.push(v[1].replace(/''/g, "'"));
    }

    if (values.length > 0) enumMap[ident] = values;
  }

  return enumMap;
};

export class SqliteProvider extends ZodDbsBaseProvider {
  constructor() {
    super({
      name: 'sqlite',
      displayName: 'SQLite',
      configurationDefaults: DEFAULT_CONFIGURATION,
    });
  }

  protected createClient = (options: ZodDbsProviderConfig) => {
    return createClient(options);
  };

  protected createColumnInfo(
    table: RawTableRow,
    column: RawColumnRow,
    schemaName: string,
    enumMap?: Record<string, string[]>
  ): ZodDbsColumnInfo {
    const dataType = (column.type || 'text').toLowerCase();

    const info: ZodDbsColumnInfo = {
      name: column.name,
      defaultValue: column.dflt_value ?? undefined,
      isNullable: column.notnull === 0,
      maxLen: parseMaxLen(column.type),
      minLen: undefined,
      dataType,
      tableName: table.name,
      schemaName,
      description: undefined,
      tableType: (table.type as ZodDbsTableType) ?? 'table',
      enumValues: undefined,
      isEnum: false,
      isSerial: column.pk === 1 && /int/i.test(column.type || ''),
      isArray: false,
    };

    // Attach enum values if a CHECK ... IN (...) constraint was found
    const ev = enumMap?.[column.name.toLowerCase()];
    if (ev && ev.length > 0) {
      info.enumValues = ev;
      info.isEnum = true;
    }
    return info;
  }

  // Override to map SQLite declared types to ZodDbsColumnType categories
  protected override getZodType(dataType: string) {
    const t = (dataType || '').toLowerCase();

    // Integer affinity
    if (t.includes('int')) return 'int';
    // Numeric/decimal/real/double/float affinity -> number
    if (
      t.includes('real') ||
      t.includes('floa') ||
      t.includes('doub') ||
      t.includes('dec') ||
      t.includes('num')
    )
      return 'number';
    // Booleans
    if (t.includes('bool')) return 'boolean';
    // Date/time
    if (t.includes('date') || t.includes('time')) return 'date';
    // JSON
    if (t.includes('json')) return 'json';
    // Text affinity (includes varchar/char/clob/text)
    if (t.includes('char') || t.includes('clob') || t.includes('text'))
      return 'string';

    return super.getZodType(dataType);
  }

  public async fetchSchemaInfo(
    config: ZodDbsProviderConfig
  ): Promise<ZodDbsColumnInfo[]> {
    const schemaName = config.schemaName || 'main';
    config.onProgress?.('connecting');
    const client = await this.createClient(config);
    await client.connect();

    config.onProgress?.('fetchingSchema');
    logDebug(`Retrieving schema information for schema '${schemaName}'`);

    try {
      const tables = await client.query<RawTableRow[]>(
        sql`SELECT name, type FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name;`
      );

      const columns: ZodDbsColumnInfo[] = [];
      for (const tbl of tables) {
        // Read CREATE TABLE SQL once per table to parse CHECK enums
        const createRows = await client.query<{ sql: string }[]>(
          'SELECT sql FROM sqlite_master WHERE type = ? AND name = ?',
          ['table', tbl.name]
        );
        const createSql = createRows?.[0]?.sql ?? '';
        const enumMap = extractEnumMapFromCreateSql(createSql);

        const pragma = await client.query<RawColumnRow[]>(
          `PRAGMA table_info(${JSON.stringify(tbl.name)});`
        );
        for (const col of pragma) {
          columns.push(this.createColumnInfo(tbl, col, schemaName, enumMap));
        }
      }

      return columns;
    } finally {
      await client.end();
    }
  }
}
