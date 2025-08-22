import type {
  ZodDbsColumnInfo,
  ZodDbsColumnType,
  ZodDbsConfig,
  ZodDbsRenderer,
  ZodDbsTableInfo,
} from 'zod-dbs-core';
import type {
  ZodDbsColumnBaseRenderModel,
  ZodDbsColumnBaseType,
  ZodDbsColumnRenderModel,
  ZodDbsImport,
  ZodDbsTableRenderModel,
} from './types.js';

import { convertCaseFormat, formatSingularString } from '../utils/casing.js';
import { renderMustacheTemplate } from '../utils/mustache.js';
import {
  formatEnumConstantName,
  formatEnumTypeName,
  formatJsonSchemaName,
  formatRecordTransformName,
  formatTableRecordName,
  formatTableSchemaName,
} from './format.js';

export interface ZodDbsRendererOptions {
  onColumnModelCreated?: (
    model: ZodDbsColumnRenderModel
  ) => ZodDbsColumnRenderModel | Promise<ZodDbsColumnRenderModel>;
  onTableModelCreated?: (
    model: ZodDbsTableRenderModel
  ) => ZodDbsTableRenderModel | Promise<ZodDbsTableRenderModel>;
}

export class ZodBaseRenderer implements ZodDbsRenderer {
  protected options: ZodDbsRendererOptions;

  constructor(options: ZodDbsRendererOptions = {}) {
    this.options = options;
  }

  protected getSchemaTemplateName(config: ZodDbsConfig): string {
    if (!config.caseTransform) return 'schema.simple';
    return 'schema';
  }

  /**
   * Returns the base type for a ZodDbsColumnType.
   * Used to determine how to render the Zod type.
   * E.g. minLen/maxLen constraints are only applied to string/number types.
   */
  protected getBaseType(type: ZodDbsColumnType): ZodDbsColumnBaseType {
    switch (type) {
      case 'string':
      case 'email':
      case 'url':
      case 'uuid':
        return 'string';
      case 'int':
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'date':
        return 'date';
      case 'json':
        return 'object';
      default:
        return 'unknown';
    }
  }

  /**
   * Takes a ZodDbsColumnType and returns the corresponding Zod type string.
   * e.g 'z.string()' for 'string', 'z.number()' for 'number'.
   */
  protected renderZodType(
    zodType: ZodDbsColumnType,
    config: ZodDbsConfig,
    isReadField: boolean
  ): string {
    const { coerceDates, defaultUnknown } = config;

    switch (zodType) {
      case 'string':
      case 'email':
      case 'url':
      case 'uuid':
        return 'z.string()';
      case 'int':
      case 'number':
        return 'z.number()';
      case 'boolean':
        return 'z.boolean()';
      case 'date':
        return coerceDates && isReadField ? 'z.coerce.date()' : 'z.date()';
      case 'unknown':
        return 'z.unknown()';
      default:
        return defaultUnknown ? 'z.unknown()' : 'z.any()';
    }
  }

  protected renderReadField(
    column: ZodDbsColumnBaseRenderModel,
    config: ZodDbsConfig
  ): string {
    let zodType = this.renderZodType(column.type, config, true);

    if (column.isEnum) zodType = `z.enum(${column.enumConstantName})`;
    if (column.isArray) zodType = `z.array(${zodType})`;

    if (
      column.type === 'json' &&
      config.jsonSchemaImportLocation &&
      column.jsonSchemaName
    ) {
      zodType = column.jsonSchemaName;
    }

    if (column.isNullable) {
      zodType = `${zodType}.nullable()`;
    }

    if (column.isOptional || column.isNullable) {
      if (column.isArray && config.defaultEmptyArray)
        zodType = `${zodType}.transform((value) => value ?? [])`;
      else if (config.defaultNullsToUndefined)
        zodType = `${zodType}.transform((value) => value ?? undefined)`;

      if (column.isOptional) {
        zodType = `${zodType}.optional()`;
      }
    }

    return zodType;
  }

  protected renderWriteField(
    column: ZodDbsColumnBaseRenderModel,
    config: ZodDbsConfig
  ): string {
    let zodType = this.renderZodType(column.type, config, false);
    const baseType = this.getBaseType(column.type);

    if (baseType === 'string' && !column.isEnum) {
      if (column.writeTransforms?.includes('trim')) {
        zodType = `${zodType}.trim()`;
      }

      if (column.writeTransforms?.includes('lowercase')) {
        zodType = `${zodType}.lowercase()`;
      }

      if (column.writeTransforms?.includes('uppercase')) {
        zodType = `${zodType}.uppercase()`;
      }

      if (column.writeTransforms?.includes('normalize')) {
        zodType = `${zodType}.normalize()`;
      }
    }

    if (baseType === 'number' && !column.isEnum) {
      if (column.writeTransforms?.includes('nonnegative')) {
        zodType = `${zodType}.nonnegative()`;
      }
    }

    if (column.isEnum) zodType = `z.enum(${column.enumConstantName})`;
    if (column.isArray) zodType = `z.array(${zodType})`;

    if (
      column.type === 'json' &&
      config.jsonSchemaImportLocation &&
      column.jsonSchemaName
    ) {
      zodType = column.jsonSchemaName;
    }

    if (!column.isEnum && (baseType === 'string' || baseType === 'number')) {
      if (column.minLen !== undefined && column.minLen !== null) {
        zodType = `${zodType}.min(${column.minLen})`;
      }

      if (column.maxLen !== undefined && column.maxLen !== null) {
        zodType = `${zodType}.max(${column.maxLen})`;
      }
    }

    if (column.isNullable) {
      zodType = `${zodType}.nullable()`;
    }

    if (column.type === 'json' && config.stringifyJson) {
      if (!column.isNullable)
        zodType = `${zodType}.transform((value) => JSON.stringify(value))`;
      else
        zodType = `${zodType}.transform((value) => value ? JSON.stringify(value) : value)`;
    }

    if (column.type === 'date' && config.stringifyDates) {
      if (column.isArray) {
        if (!column.isNullable)
          zodType = `${zodType}.transform((value) => value.map(date => date.toISOString()))`;
        else
          zodType = `${zodType}.transform((value) => value ? value.map(date => date.toISOString()) : value)`;
      } else {
        if (!column.isNullable)
          zodType = `${zodType}.transform((value) => value.toISOString())`;
        else
          zodType = `${zodType}.transform((value) => value ? value.toISOString() : value)`;
      }
    }

    if (column.isOptional) {
      zodType = `${zodType}.optional()`;
    }

    return zodType;
  }

  protected createColumnModel(
    column: ZodDbsColumnInfo,
    config: ZodDbsConfig
  ): ZodDbsColumnRenderModel {
    const baseModel = {
      propertyName: convertCaseFormat(column.name, config.fieldNameCasing),
      enumConstantName: formatEnumConstantName({
        tableName: column.tableName,
        colName: column.name,
        singularize: config.singularization,
      }),
      jsonSchemaName: formatJsonSchemaName({
        tableName: column.tableName,
        columnName: column.name,
        casing: config.objectNameCasing,
        singularize: config.singularization,
      }),
      ...column,
    };

    return {
      ...baseModel,
      renderedReadType: this.renderReadField(baseModel, config),
      renderedWriteType: this.renderWriteField(baseModel, config),
    };
  }

  protected createJsonSchemaImports(
    columns: ZodDbsColumnRenderModel[],
    config: ZodDbsConfig
  ): ZodDbsImport[] | undefined {
    if (!config.jsonSchemaImportLocation) return undefined;

    const jsonFields = columns.filter(
      (col) => col.type === 'json' && col.jsonSchemaName
    );

    return jsonFields.map((col, index) => ({
      name: col.jsonSchemaName,
      last: index === jsonFields.length - 1,
    })) as ZodDbsImport[];
  }

  protected createWritableColumns(
    columns: ZodDbsColumnRenderModel[]
  ): ZodDbsColumnRenderModel[] {
    return columns.filter((column) => column.isWritable);
  }

  protected async createTableModel(
    tableInfo: ZodDbsTableInfo,
    config: ZodDbsConfig
  ): Promise<ZodDbsTableRenderModel> {
    const readableColumns: ZodDbsColumnRenderModel[] = [];

    for (const column of tableInfo.columns) {
      let model = this.createColumnModel(column, config);

      if (this.options.onColumnModelCreated) {
        const modifiedModel = await this.options.onColumnModelCreated(model);

        readableColumns.push({
          ...modifiedModel,

          // Need to re-render types and transforms after model modification,
          // except if they are already modified

          renderedReadType:
            modifiedModel.renderedReadType === model.renderedReadType
              ? this.renderReadField(modifiedModel, config)
              : modifiedModel.renderedReadType,

          renderedWriteType:
            modifiedModel.renderedWriteType === model.renderedWriteType
              ? this.renderWriteField(modifiedModel, config)
              : modifiedModel.renderedWriteType,
        });
      } else {
        readableColumns.push(model);
      }
    }

    const writableColumns = this.createWritableColumns(readableColumns);
    const jsonSchemaImports = this.createJsonSchemaImports(
      readableColumns,
      config
    );

    const enums = readableColumns
      .filter((column) => column.isEnum)
      .map((column) => {
        const enumValues = column.enumValues || [];

        return {
          constantName: column.enumConstantName!,
          typeName:
            column.enumTypeName ??
            formatEnumTypeName({
              tableName: column.tableName,
              colName: column.name,
              casing: config.objectNameCasing,
              singularize: config.singularization,
            }),
          values: enumValues.map((value, index) => ({
            value,
            last: index === enumValues.length - 1,
          })),
        };
      });

    const tableModel: ZodDbsTableRenderModel = {
      type: tableInfo.type,
      tableName: tableInfo.name,
      schemaName: tableInfo.schemaName,
      tableSingularName: formatSingularString(
        tableInfo.name,
        config.objectNameCasing
      ),
      tableReadBaseSchemaName: formatTableSchemaName({
        tableInfo,
        operation: 'read',
        casing: config.objectNameCasing,
        suffix: 'BaseSchema',
      }),
      tableInsertBaseSchemaName: formatTableSchemaName({
        tableInfo,
        operation: 'insert',
        casing: config.objectNameCasing,
        suffix: 'BaseSchema',
      }),
      tableReadTransformName: formatRecordTransformName({
        tableInfo,
        operation: 'read',
        casing: config.fieldNameCasing,
        singularize: config.singularization,
      }),
      tableInsertTransformName: formatRecordTransformName({
        tableInfo,
        operation: 'insert',
        casing: config.fieldNameCasing,
        singularize: config.singularization,
      }),
      tableUpdateTransformName: formatRecordTransformName({
        tableInfo,
        operation: 'update',
        casing: config.fieldNameCasing,
        singularize: config.singularization,
      }),
      tableReadSchemaName: formatTableSchemaName({
        tableInfo,
        operation: 'read',
        casing: config.objectNameCasing,
      }),
      tableInsertSchemaName: formatTableSchemaName({
        tableInfo,
        operation: 'insert',
        casing: config.objectNameCasing,
      }),
      tableUpdateSchemaName: formatTableSchemaName({
        tableInfo,
        operation: 'update',
        casing: config.objectNameCasing,
      }),
      tableInsertRecordName: formatTableRecordName({
        tableInfo,
        operation: 'insert',
        casing: config.objectNameCasing,
        singularize: config.singularization,
      }),
      tableReadBaseRecordName: formatTableRecordName({
        tableInfo,
        operation: 'read',
        casing: config.objectNameCasing,
        singularize: config.singularization,
        suffix: 'BaseRecord',
      }),
      tableInsertBaseRecordName: formatTableRecordName({
        tableInfo,
        operation: 'insert',
        casing: config.objectNameCasing,
        singularize: config.singularization,
        suffix: 'BaseRecord',
      }),
      tableUpdateBaseRecordName: formatTableRecordName({
        tableInfo,
        operation: 'update',
        casing: config.objectNameCasing,
        singularize: config.singularization,
        suffix: 'BaseRecord',
      }),
      tableReadRecordName: formatTableRecordName({
        tableInfo,
        operation: 'read',
        singularize: config.singularization,
        casing: config.objectNameCasing,
      }),
      tableUpdateRecordName: formatTableRecordName({
        tableInfo,
        operation: 'update',
        singularize: config.singularization,
        casing: config.objectNameCasing,
      }),
      jsonSchemaImportLocation: config.jsonSchemaImportLocation,
      jsonSchemaImports,
      hasJsonSchemaImports: !!jsonSchemaImports?.length,
      readableColumns,
      writableColumns,
      enums,
      isWritable: writableColumns.length > 0,
    };

    if (this.options.onTableModelCreated) {
      return await this.options.onTableModelCreated(tableModel);
    }

    return tableModel;
  }

  protected async renderTemplate(
    templateName: string,
    model: ZodDbsTableRenderModel
  ): Promise<string> {
    return await renderMustacheTemplate(templateName, model);
  }

  public async renderSchemaFile(
    table: ZodDbsTableInfo,
    config: ZodDbsConfig
  ): Promise<string> {
    const templateName = this.getSchemaTemplateName(config);
    const model = await this.createTableModel(table, config);

    return await this.renderTemplate(templateName, model);
  }
}
