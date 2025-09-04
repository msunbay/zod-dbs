import pluralize from 'pluralize';
import { ZodDbsCasing, ZodDbsFieldCasing, ZodDbsTable } from 'zod-dbs-core';

import {
  convertCaseFormat,
  pascalCase,
  singularPascalCase,
  singularUpperCase,
  snakeCase,
} from '../utils/casing.js';

const MVIEW_PREFIXES = ['mv_', 'mview_'];
const VIEW_PREFIXES = ['v_', 'view_'];

export type Operation = 'read' | 'insert' | 'update' | 'write';

const getOperationSuffix = (type: Operation): string => {
  switch (type) {
    case 'insert':
      return 'Insert';
    case 'update':
      return 'Update';
    case 'write':
      return 'Write';
    case 'read':
      return '';
    default:
      return '';
  }
};

export const getSchemaPrefix = (table: ZodDbsTable): string => {
  switch (table.type) {
    case 'table':
    case 'foreign_table':
      return 'Table';
    case 'materialized_view':
      // If the table name starts with a known materialized view prefix, return an empty string
      // to avoid adding 'Mv' prefix unnecessarily.
      return MVIEW_PREFIXES.some((prefix) => table.name.startsWith(prefix))
        ? ''
        : 'Mv';
    case 'view':
      // If the table name starts with a known view prefix, return an empty string
      // to avoid adding 'View' prefix unnecessarily.
      return VIEW_PREFIXES.some((prefix) => table.name.startsWith(prefix))
        ? ''
        : 'View';
    default:
      return '';
  }
};

export const formatRecordTransformName = ({
  table,
  operation: type,
  singularize = true,
  casing = 'camelCase',
  suffix = 'BaseRecord',
}: {
  table: ZodDbsTable;
  operation: Operation;
  casing?: ZodDbsFieldCasing;
  singularize?: boolean;
  suffix?: string;
}): string => {
  const tableName = singularize
    ? singularPascalCase(table.name)
    : pascalCase(table.name);

  const name = `transform${tableName}${getOperationSuffix(type)}${suffix}`;
  return convertCaseFormat(name, casing);
};

export const formatTableSchemaName = ({
  table,
  operation: type,
  casing = 'PascalCase',
  suffix = 'Schema',
}: {
  table: ZodDbsTable;
  operation: Operation;
  casing?: ZodDbsCasing;
  suffix?: string;
}): string => {
  const name = `${pascalCase(table.name)}${getSchemaPrefix(table)}${getOperationSuffix(type)}${suffix}`;
  return convertCaseFormat(name, casing);
};

export const formatTableRecordName = ({
  table,
  operation,
  singularize = true,
  casing = 'PascalCase',
  suffix = 'Record',
}: {
  table: ZodDbsTable;
  operation: Operation;
  casing?: ZodDbsCasing;
  singularize?: boolean;
  suffix?: string;
}): string => {
  const tableName = singularize
    ? singularPascalCase(table.name)
    : pascalCase(table.name);

  const name = `${tableName}${getOperationSuffix(operation)}${suffix}`;
  return convertCaseFormat(name, casing);
};

export const formatObjectSchemaName = ({
  tableName,
  columnName,
  casing = 'PascalCase',
  singularize = true,
  suffix = 'Schema',
}: {
  tableName: string;
  columnName: string;
  casing?: ZodDbsCasing;
  singularize?: boolean;
  suffix?: string;
}): string => {
  const pascalTableName = singularize
    ? singularPascalCase(tableName)
    : pascalCase(tableName);

  const name = `${pascalTableName}${pascalCase(columnName)}${suffix}`;
  return convertCaseFormat(name, casing);
};

export const formatEnumConstantName = ({
  tableName,
  colName,
  singularize = true,
}: {
  tableName: string;
  colName: string;
  singularize?: boolean;
}): string => {
  const upperTableName = singularize
    ? singularUpperCase(tableName)
    : tableName.toUpperCase();

  const upperColName = snakeCase(colName).toUpperCase();

  return pluralize(`${upperTableName}_${upperColName}`);
};

export const formatEnumTypeName = ({
  tableName,
  colName,
  casing = 'PascalCase',
  singularize = true,
}: {
  tableName: string;
  colName: string;
  casing?: ZodDbsCasing;
  singularize?: boolean;
}): string => {
  const pascalTableName = singularize
    ? singularPascalCase(tableName)
    : pascalCase(tableName);

  const pascalColName = singularize
    ? singularPascalCase(colName)
    : pascalCase(colName);

  return convertCaseFormat(`${pascalTableName}${pascalColName}`, casing);
};

export const formatPropertyName = (
  columnName: string,
  casing: ZodDbsFieldCasing = 'camelCase'
): string => {
  // Remove leading underscores
  const normalizedColumnName = columnName.replace(/^_+/, '');
  return convertCaseFormat(normalizedColumnName, casing);
};
