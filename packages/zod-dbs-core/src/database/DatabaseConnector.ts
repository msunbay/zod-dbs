import type {
  ZodDbsColumnInfo,
  ZodDbsConnectorConfig,
  ZodDbsDbConnector,
  ZodDbsSchemaInfo,
  ZodDbsTableInfo,
} from '../types.js';

import { logDebug } from '../utils/debug.js';

/**
 * Base class for database connectors.
 * Provides common functionality for fetching schema information and processing columns.
 * Should be extended by specific database connectors like PostgreSqlConnector.
 */
export abstract class DatabaseConnector implements ZodDbsDbConnector {
  protected async createSchemaInfo(
    tables: ZodDbsTableInfo[],
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

  protected async createTables(
    columns: ZodDbsColumnInfo[],
    config: ZodDbsConnectorConfig
  ): Promise<ZodDbsTableInfo[]> {
    const tablesMap = new Map<string, ZodDbsTableInfo>();
    const { schemaName = 'public' } = config;

    for (const column of columns) {
      const key = `${schemaName}:${column.tableName}`;
      let table = tablesMap.get(key);
      let modifiedColumn = column;

      if (config.onColumnModelCreated) {
        modifiedColumn = await config.onColumnModelCreated(column);
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

      table.columns.push(modifiedColumn);
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
    const tables = await this.createTables(filteredColumns, config);

    return await this.createSchemaInfo(tables, config);
  }
}
