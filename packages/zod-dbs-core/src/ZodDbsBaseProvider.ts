import type {
  ZodDbsColumn,
  ZodDbsColumnInfo,
  ZodDbsConnectorConfig,
  ZodDbsProvider,
  ZodDbsSchemaInfo,
  ZodDbsTable,
} from './types.js';

import { getZodType } from './getZodType.js';
import { logDebug } from './utils/debug.js';

export interface ZodDbsProviderOptions {
  name: string;
  displayName?: string;
}

/**
 * Base class for database connectors.
 * Provides common functionality for fetching schema information and processing columns.
 * Should be extended by specific database providers like PostgreSqlProvider.
 */
export abstract class ZodDbsBaseProvider implements ZodDbsProvider {
  name: string;
  displayName?: string;

  constructor(options: ZodDbsProviderOptions) {
    this.name = options.name;
    this.displayName = options.displayName;
  }

  protected async createSchemaInfo(
    tables: ZodDbsTable[],
    config: ZodDbsConnectorConfig
  ): Promise<ZodDbsSchemaInfo> {
    const { schemaName = 'public' } = config;
    const result: ZodDbsSchemaInfo = { name: schemaName, tables };

    if (config.onTableModelCreated) {
      const modifiedTables = [];

      for (const table of tables) {
        const modifiedTable = await config.onTableModelCreated(table);
        modifiedTables.push(modifiedTable);
      }

      result.tables = modifiedTables;
    }

    return result;
  }

  protected abstract fetchSchemaInfo(
    config: ZodDbsConnectorConfig
  ): Promise<ZodDbsColumnInfo[]>;

  protected filterColumns(
    columns: ZodDbsColumnInfo[],
    config: ZodDbsConnectorConfig
  ): ZodDbsColumnInfo[] {
    const { include, exclude } = config;

    if (!exclude && !include) return columns;

    let filteredColumns = [...columns];

    if (include) {
      if (typeof include === 'string') {
        const includeRegex = new RegExp(include);
        filteredColumns = filteredColumns.filter((column) =>
          includeRegex.test(column.tableName)
        );
      } else {
        filteredColumns = filteredColumns.filter((column) =>
          include.includes(column.tableName)
        );
      }
    }

    if (exclude) {
      if (typeof exclude === 'string') {
        const excludeRegex = new RegExp(exclude);
        filteredColumns = filteredColumns.filter(
          (column) => !excludeRegex.test(column.tableName)
        );
      } else {
        filteredColumns = filteredColumns.filter(
          (column) => !exclude.includes(column.tableName)
        );
      }
    }

    return filteredColumns;
  }

  protected createColumnModel(column: ZodDbsColumnInfo): ZodDbsColumn {
    return {
      ...column,
      type: getZodType(column.dataType),
      isWritable:
        column.isWritable ?? (!column.isSerial && column.tableType === 'table'),
      isReadOptional: column.isNullable,
      isWriteOptional: column.isNullable || !!column.defaultValue,
    };
  }

  protected async createTableModels(
    columns: ZodDbsColumnInfo[],
    config: ZodDbsConnectorConfig
  ): Promise<ZodDbsTable[]> {
    const tablesMap = new Map<string, ZodDbsTable>();
    const { schemaName = 'public' } = config;

    for (const column of columns) {
      const key = `${schemaName}:${column.tableName}`;
      let table = tablesMap.get(key);

      let columnModel = this.createColumnModel(column);

      if (config.onColumnModelCreated) {
        columnModel = await config.onColumnModelCreated(columnModel);
      }

      if (!table) {
        table = {
          type: column.tableType,
          name: column.tableName,
          schemaName,
          columns: [],
        };

        tablesMap.set(key, table);
      }

      table.columns.push(columnModel);
    }

    let tables = Array.from(tablesMap.values());

    // sort tables by type and name
    tables.sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.name.localeCompare(b.name);
    });

    logDebug(`Found ${tables.length} tables in schema '${schemaName}'`);

    return tables;
  }

  async getSchemaInformation(
    config: ZodDbsConnectorConfig
  ): Promise<ZodDbsSchemaInfo> {
    const columns = await this.fetchSchemaInfo(config);
    const filteredColumns = this.filterColumns(columns, config);
    const tables = await this.createTableModels(filteredColumns, config);

    return await this.createSchemaInfo(tables, config);
  }
}
