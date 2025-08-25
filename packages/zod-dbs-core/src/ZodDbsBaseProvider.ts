import type {
  ZodDbsColumn,
  ZodDbsColumnInfo,
  ZodDbsColumnType,
  ZodDbsConfig,
  ZodDbsProvider,
  ZodDbsProviderConfig,
  ZodDbsSchemaInfo,
  ZodDbsTable,
} from './types.js';

import { getZodType } from './getZodType.js';
import { logDebug } from './utils/debug.js';

export interface ZodDbsProviderOptions {
  name: string;
  displayName?: string;
  defaultConfiguration?: Partial<ZodDbsConfig>;
}

/**
 * Base class for schema information providers.
 * Provides common functionality for fetching schema information and processing columns.
 * Should be extended by specific database providers like PostgreSqlProvider.
 */
export abstract class ZodDbsBaseProvider implements ZodDbsProvider {
  name: string;
  displayName?: string;
  defaultConfiguration?: ZodDbsConfig;

  constructor(options: ZodDbsProviderOptions) {
    this.name = options.name;
    this.displayName = options.displayName;
    this.defaultConfiguration = options.defaultConfiguration;
  }

  protected initConfiguration(config: ZodDbsConfig): ZodDbsConfig {
    return { ...this.defaultConfiguration, ...config };
  }

  protected async createSchemaInfo(
    tables: ZodDbsTable[],
    config: ZodDbsProviderConfig
  ): Promise<ZodDbsSchemaInfo> {
    const result: ZodDbsSchemaInfo = { tables };

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
    config: ZodDbsProviderConfig
  ): Promise<ZodDbsColumnInfo[]>;

  protected filterColumns(
    columns: ZodDbsColumnInfo[],
    config: ZodDbsProviderConfig
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

  protected getZodType(dataType: string): ZodDbsColumnType {
    return getZodType(dataType);
  }

  protected createColumnModel(column: ZodDbsColumnInfo): ZodDbsColumn {
    return {
      ...column,
      type: this.getZodType(column.dataType),
      isWritable:
        column.isWritable ?? (!column.isSerial && column.tableType === 'table'),
      isReadOptional: column.isNullable,
      isWriteOptional: column.isNullable || !!column.defaultValue,
    };
  }

  protected async createTableModels(
    columns: ZodDbsColumnInfo[],
    config: ZodDbsProviderConfig
  ): Promise<ZodDbsTable[]> {
    const tablesMap = new Map<string, ZodDbsTable>();

    for (const column of columns) {
      const key = `${column.schemaName}:${column.tableName}`;
      let table = tablesMap.get(key);

      let columnModel = this.createColumnModel(column);

      if (config.onColumnModelCreated) {
        columnModel = await config.onColumnModelCreated(columnModel);
      }

      if (!table) {
        table = {
          type: column.tableType,
          name: column.tableName,
          schemaName: column.schemaName,
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

    logDebug(`Found ${tables.length} tables`);

    return tables;
  }

  async getSchemaInformation(
    config: ZodDbsProviderConfig
  ): Promise<ZodDbsSchemaInfo> {
    const finalConfig = this.initConfiguration(config);

    const columns = await this.fetchSchemaInfo(finalConfig);
    const filteredColumns = this.filterColumns(columns, finalConfig);
    const tables = await this.createTableModels(filteredColumns, finalConfig);

    return await this.createSchemaInfo(tables, finalConfig);
  }
}
