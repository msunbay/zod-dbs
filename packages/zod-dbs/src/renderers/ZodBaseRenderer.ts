import type {
  ZodDbsColumn,
  ZodDbsColumnType,
  ZodDbsConfig,
  ZodDbsRenderer,
  ZodDbsTable,
} from 'zod-dbs-core';
import type {
  ZodDbsColumnBaseRenderModel,
  ZodDbsColumnBaseType,
  ZodDbsColumnRenderModel,
  ZodDbsImport,
  ZodDbsTableRenderModel,
} from './types.js';

import { renderMustacheTemplate } from '../utils/mustache.js';
import {
  formatEnumConstantName,
  formatEnumTypeName,
  formatObjectSchemaName,
  formatPropertyName,
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

export interface ZodDbsRenderZodTypeParams {
  zodType: ZodDbsColumnType;
  config: ZodDbsConfig;
  isReadField: boolean;
}

export class ZodBaseRenderer implements ZodDbsRenderer {
  protected options: ZodDbsRendererOptions;

  constructor(options: ZodDbsRendererOptions = {}) {
    this.options = options;
  }

  protected getSchemaTemplateName(
    model: ZodDbsTableRenderModel,
    config: ZodDbsConfig
  ): string {
    if (!config.caseTransform) return 'schema.simple';

    // Check if any columns needs case transformation
    const needsTransform = model.readableColumns.some(
      (col) => col.propertyName !== col.name
    );

    if (!needsTransform) return 'schema.simple';
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
  protected renderZodType({
    zodType,
    config,
    isReadField,
  }: ZodDbsRenderZodTypeParams): string {
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
    let zodType = this.renderZodType({
      zodType: column.type,
      config,
      isReadField: true,
    });

    if (
      column.type === 'json' &&
      config.jsonSchemaImportLocation &&
      column.jsonSchemaName
    ) {
      zodType = column.jsonSchemaName;
    }

    if (column.type === 'object' && column.objectDefinition) {
      zodType = column.jsonSchemaName;
    }

    if (column.isEnum) zodType = `z.enum(${column.enumConstantName})`;
    if (column.isArray) zodType = `z.array(${zodType})`;

    if (column.isNullable) {
      zodType = `${zodType}.nullable()`;
    }

    if (column.isReadOptional || column.isNullable) {
      if (column.isArray && config.defaultEmptyArray)
        zodType = `${zodType}.transform((value) => value ?? [])`;
      else if (config.defaultNullsToUndefined)
        zodType = `${zodType}.transform((value) => value ?? undefined)`;

      if (column.isReadOptional) {
        zodType = `${zodType}.optional()`;
      }
    }

    return zodType;
  }

  protected renderWriteField(
    column: ZodDbsColumnBaseRenderModel,
    config: ZodDbsConfig
  ): string {
    let zodType = this.renderZodType({
      zodType: column.type,
      config,
      isReadField: false,
    });

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

    if (
      column.type === 'json' &&
      config.jsonSchemaImportLocation &&
      column.jsonSchemaName
    ) {
      zodType = column.jsonSchemaName;
    }

    if (column.type === 'object' && column.objectDefinition) {
      zodType = column.jsonSchemaName;
    }

    if (column.isEnum) zodType = `z.enum(${column.enumConstantName})`;
    if (column.isArray) zodType = `z.array(${zodType})`;

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

    if (column.isWriteOptional) {
      zodType = `${zodType}.optional()`;
    }

    return zodType;
  }

  protected createColumnModel(
    column: ZodDbsColumn,
    config: ZodDbsConfig
  ): ZodDbsColumnRenderModel {
    const baseModel = {
      isOptional: column.isReadOptional,
      propertyName: formatPropertyName(column.name, config.fieldNameCasing),
      enumConstantName: formatEnumConstantName({
        tableName: column.tableName,
        colName: column.name,
        singularize: config.singularization,
      }),
      jsonSchemaName: formatObjectSchemaName({
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

  protected createEnums(
    columns: ZodDbsColumnRenderModel[],
    config: ZodDbsConfig
  ) {
    return columns
      .filter((column) => column.isEnum)
      .map((column) => {
        const enumValues = column.enumValues || [];

        if (!column.enumConstantName)
          throw new Error(
            `Enum constant name not defined for column ${column.name} in table ${column.tableName}`
          );

        return {
          constantName: column.enumConstantName,
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
  }

  protected async createObjectModels(
    table: ZodDbsTable,
    config: ZodDbsConfig
  ): Promise<ZodDbsTableRenderModel[]> {
    const columns = table.columns.filter(
      (column) => column.objectDefinition
    ) as (ZodDbsColumn & { objectDefinition: ZodDbsTable })[];

    const objectModels: ZodDbsTableRenderModel[] = [];

    for (const column of columns) {
      const model = await this.createTableModel(
        {
          ...column.objectDefinition,
          name: formatObjectSchemaName({
            tableName: table.name,
            columnName: column.name,
            suffix: '',
          }),
        },
        {
          ...config,
          jsonSchemaImportLocation: undefined,
          defaultNullsToUndefined: false,
        }
      );

      objectModels.push(model);
    }

    return objectModels;
  }

  protected createObjectSchemaImports(
    columns: ZodDbsColumnRenderModel[],
    config: ZodDbsConfig
  ): ZodDbsImport[] | undefined {
    const objectFields = columns.filter(
      (col) => col.type === 'object' && col.objectDefinition
    );

    return objectFields.map((col) => ({
      name: col.jsonSchemaName,
      fileName:
        config.moduleResolution === 'esm'
          ? `${col.jsonSchemaName}.js`
          : `${col.jsonSchemaName}`,
    })) as ZodDbsImport[];
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
      fileName: config.jsonSchemaImportLocation,
    })) as ZodDbsImport[];
  }

  protected createWritableColumns(
    columns: ZodDbsColumnRenderModel[]
  ): ZodDbsColumnRenderModel[] {
    return columns
      .filter((column) => column.isWritable)
      .map((column) => ({
        ...column,
        isOptional: column.isWriteOptional,
      }));
  }

  protected async createReadableColumns(
    table: ZodDbsTable,
    config: ZodDbsConfig
  ): Promise<ZodDbsColumnRenderModel[]> {
    const readableColumns: ZodDbsColumnRenderModel[] = [];

    for (const column of table.columns) {
      const model = this.createColumnModel(column, config);

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

    return readableColumns;
  }

  protected async createTableModel(
    table: ZodDbsTable,
    config: ZodDbsConfig
  ): Promise<ZodDbsTableRenderModel> {
    const readableColumns = await this.createReadableColumns(table, config);

    const enums = this.createEnums(readableColumns, config);
    const writableColumns = this.createWritableColumns(readableColumns);
    const jsonSchemaImports = this.createJsonSchemaImports(
      readableColumns,
      config
    );
    const objectSchemaImports = this.createObjectSchemaImports(
      readableColumns,
      config
    );

    const tableModel: ZodDbsTableRenderModel = {
      fullName: table.schemaName
        ? `${table.schemaName}.${table.name}`
        : table.name,
      type: table.type,
      tableName: table.name,
      schemaName: table.schemaName,

      tableReadBaseSchemaName: formatTableSchemaName({
        table,
        operation: 'read',
        casing: config.objectNameCasing,
        suffix: 'BaseSchema',
      }),
      tableInsertBaseSchemaName: formatTableSchemaName({
        table,
        operation: 'insert',
        casing: config.objectNameCasing,
        suffix: 'BaseSchema',
      }),
      tableReadTransformName: formatRecordTransformName({
        table,
        operation: 'read',
        casing: config.fieldNameCasing,
        singularize: config.singularization,
      }),
      tableInsertTransformName: formatRecordTransformName({
        table,
        operation: 'insert',
        casing: config.fieldNameCasing,
        singularize: config.singularization,
      }),
      tableUpdateTransformName: formatRecordTransformName({
        table,
        operation: 'update',
        casing: config.fieldNameCasing,
        singularize: config.singularization,
      }),
      tableReadSchemaName: formatTableSchemaName({
        table,
        operation: 'read',
        casing: config.objectNameCasing,
      }),
      tableInsertSchemaName: formatTableSchemaName({
        table,
        operation: 'insert',
        casing: config.objectNameCasing,
      }),
      tableUpdateSchemaName: formatTableSchemaName({
        table,
        operation: 'update',
        casing: config.objectNameCasing,
      }),
      tableInsertRecordName: formatTableRecordName({
        table,
        operation: 'insert',
        casing: config.objectNameCasing,
        singularize: config.singularization,
      }),
      tableReadBaseRecordName: formatTableRecordName({
        table,
        operation: 'read',
        casing: config.objectNameCasing,
        singularize: config.singularization,
        suffix: 'BaseRecord',
      }),
      tableInsertBaseRecordName: formatTableRecordName({
        table,
        operation: 'insert',
        casing: config.objectNameCasing,
        singularize: config.singularization,
        suffix: 'BaseRecord',
      }),
      tableUpdateBaseRecordName: formatTableRecordName({
        table,
        operation: 'update',
        casing: config.objectNameCasing,
        singularize: config.singularization,
        suffix: 'BaseRecord',
      }),
      tableReadRecordName: formatTableRecordName({
        table,
        operation: 'read',
        singularize: config.singularization,
        casing: config.objectNameCasing,
      }),
      tableUpdateRecordName: formatTableRecordName({
        table,
        operation: 'update',
        singularize: config.singularization,
        casing: config.objectNameCasing,
      }),
      jsonSchemaImportLocation: config.jsonSchemaImportLocation,
      jsonSchemaImports,
      hasJsonSchemaImports: !!jsonSchemaImports?.length,
      objectSchemaImports,
      readableColumns,
      writableColumns,
      enums,
      isWritable: table.type === 'table' && writableColumns.length > 0,
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
    table: ZodDbsTable,
    config: ZodDbsConfig
  ): Promise<string> {
    const model = await this.createTableModel(table, config);
    const templateName = this.getSchemaTemplateName(model, config);

    return await this.renderTemplate(templateName, model);
  }

  public async renderSchemaFiles(
    table: ZodDbsTable,
    config: ZodDbsConfig
  ): Promise<{ name: string; content: string }[]> {
    const model = await this.createTableModel(table, config);
    const objectModels = await this.createObjectModels(table, config);

    const templateName = this.getSchemaTemplateName(model, config);

    const mainFileContent = await this.renderTemplate(templateName, model);
    const files = [{ name: 'schema', content: mainFileContent }];

    // Generate separate files for object schemas
    for (const objectModel of objectModels) {
      const objectContent = await this.renderTemplate(
        templateName,
        objectModel
      );

      files.push({
        name: objectModel.tableReadSchemaName ?? objectModel.tableName,
        content: objectContent,
      });
    }

    return files;
  }
}
