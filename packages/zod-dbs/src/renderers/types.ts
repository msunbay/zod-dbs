import type { ZodDbsColumn, ZodDbsTableType } from 'zod-dbs-core';

export type ZodDbsColumnBaseType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'object'
  | 'unknown';

/**
 * Base model for a column with additional processing and naming information.
 * This represents the column after initial processing but before final rendering.
 */
export interface ZodDbsColumnBaseRenderModel extends ZodDbsColumn {
  isOptional: boolean;
  /**
   * The property name of the column in the generated Zod schema.
   * This is typically the column name transformed according to the specified casing (e.g., camelCase).
   */
  propertyName: string;
  /**
   * The name of the enum type for the column.
   * Used when the column is identified as an enum type through check constraints.
   * Example: 'UserStatus' for a status column with enum values.
   */
  enumTypeName?: string;
  /**
   * The constant name of the enum type for the column.
   * Used for generating enum constants in the constants file.
   * Example: 'USER_STATUS_ENUM' for a status column.
   */
  enumConstantName?: string;
  /**
   * The name of the JSON Zod schema for the column.
   * Used when the JSON schema import feature is enabled for JSON/JSONB columns.
   * Example: 'UserProfileSchema' for a profile column.
   */
  jsonSchemaName?: string;
}

/**
 * Final column model with fully rendered Zod types and transforms.
 * This represents the column after all processing and is ready for template generation.
 */
export interface ZodDbsColumnRenderModel extends ZodDbsColumnBaseRenderModel {
  /**
   * The fully rendered Zod type/schema for reading operations.
   * Example: 'z.string()', 'z.number().optional()', 'z.date()'
   */
  renderedReadType: string;
  /**
   * The fully rendered Zod type/schema for writing operations (insert/update).
   * May include additional constraints like max length, nullish handling, etc.
   * Example: 'z.string().max(100)', 'z.number().nullish()', 'z.string().email()'
   */
  renderedWriteType: string;
}

/**
 * Represents a single value in an enumeration with rendering context.
 */
interface ZodDbsEnumValue {
  /** The actual enum value */
  value: string;
  /** Whether this is the last value in the enum (used for template rendering) */
  last: boolean;
}

/**
 * Represents an enumeration type derived from check constraints.
 */
export interface ZodDbsEnum {
  /** The constant name for the enum (e.g., 'USER_STATUS_ENUM') */
  constantName: string;
  /** The TypeScript type name for the enum (e.g., 'UserStatus') */
  typeName: string;
  /** Array of possible enum values */
  values: ZodDbsEnumValue[];
}

/**
 * Represents an import statement with rendering context.
 */
export interface ZodDbsImport {
  /** The name to import (e.g., 'UserProfileSchema') */
  name: string;
  /** Whether this is the last import in the list (used for template rendering) */
  last: boolean;
}

/**
 * Complete table model ready for template generation.
 * Contains all processed information needed to generate Zod schemas for a table or view.
 */
export interface ZodDbsTableRenderModel {
  /** The schema name where this table resides */
  schemaName?: string;
  /** The type of relation (table, view, etc.) */
  type: ZodDbsTableType;
  /** The original table name */
  tableName: string;
  /** The singular form of the table name (e.g., 'user' from 'users') */
  tableSingularName: string;

  /** Generated name for the read base schema (e.g., 'UserBaseSchema') */
  tableReadBaseSchemaName?: string;
  /** Generated name for the write base schema (e.g., 'UserWriteBaseSchema') */
  tableInsertBaseSchemaName?: string;
  /** Generated name for the read transform function (e.g., 'transformUserReadRecord') */
  tableReadTransformName?: string;
  /** Generated name for the insert transform function (e.g., 'transformUserInsertRecord') */
  tableInsertTransformName?: string;
  /** Generated name for the update transform function (e.g., 'transformUserUpdateRecord') */
  tableUpdateTransformName?: string;
  /** Generated name for the read schema (e.g., 'UserSchema') */
  tableReadSchemaName?: string;
  /** Generated name for the insert schema (e.g., 'UserInsertSchema') */
  tableInsertSchemaName?: string;
  /** Generated name for the update schema (e.g., 'UserUpdateSchema') */
  tableUpdateSchemaName?: string;

  /** Generated name for the base read record type (e.g., 'UserReadRecord') */
  tableReadBaseRecordName?: string;
  /** Generated name for the read record type (e.g., 'UserRecord') */
  tableReadRecordName?: string;
  /** Generated name for the base write record type (e.g., 'UserInsertBaseRecord') */
  tableInsertBaseRecordName?: string;
  /** Generated name for the insert record type (e.g., 'UserInsertRecord') */
  tableInsertRecordName?: string;
  /** Generated name for the base update record type (e.g., 'UserUpdateBaseRecord') */
  tableUpdateBaseRecordName?: string;
  /** Generated name for the update record type (e.g., 'UserUpdateRecord') */
  tableUpdateRecordName?: string;

  /** Optional description for the table schema */
  description?: string;

  /** Location to import JSON schemas from, if JSON schema feature is enabled */
  jsonSchemaImportLocation?: string;
  /** Array of JSON schema imports needed for this table */
  jsonSchemaImports?: ZodDbsImport[];
  /** Whether this table has any JSON schema imports */
  hasJsonSchemaImports: boolean;

  /** Array of enum types found in this table */
  enums: ZodDbsEnum[];
  /** Columns that should be included in read schemas */
  readableColumns: ZodDbsColumnRenderModel[];
  /** Columns that should be included in write (insert/update) schemas */
  writableColumns: ZodDbsColumnRenderModel[];
  /** Whether this table supports write operations (false for views, etc.) */
  isWritable: boolean;
}
