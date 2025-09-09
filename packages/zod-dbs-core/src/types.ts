/**
 * Represents the overall schema information for a database schema.
 */
export interface ZodDbsSchemaInfo {
  /** Array of all tables found in the schema */
  tables: ZodDbsTable[];
}

/**
 * Represents information about a table, view, or other relation.
 */
export interface ZodDbsTable {
  /** The type of relation (table, view, materialized view, etc.) */
  type: ZodDbsTableType;
  /** The name of the table/relation */
  name: string;
  /** The schema name where this table resides */
  schemaName?: string;
  /** Array of all columns in this table */
  columns: ZodDbsColumn[];
}

/**
 * Enum representing the different types of relations that can be processed.
 */
export type ZodDbsTableType =
  | 'table' // Regular table
  | 'view' // Database view
  | 'materialized_view' // Materialized view
  | 'foreign_table' // Foreign data wrapper table
  | 'object' // Custom object definition
  | 'unknown'; // Unknown or unsupported type

/**
 * Transform types that can be applied to Zod write schemas.
 */
export type ZodDbsTransform =
  | 'trim'
  | 'lowercase'
  | 'uppercase'
  | 'normalize'
  | 'nonnegative';

/**
 * This interface represents data about a database column returned by a provider.
 */
export interface ZodDbsColumnInfo {
  /** The name of the column */
  name: string;
  /** The default value expression for the column, if any */
  defaultValue?: string;
  /** Whether the column allows NULL values */
  isNullable: boolean;
  /** Maximum length constraint for string or number columns */
  maxLen?: number;
  /** Minimum length constraint for string or number columns */
  minLen?: number;
  /**
   * Data type of the column as defined in database.
   * This value is used by the type mapping system to determine the appropriate Zod schema type.
   */
  dataType: string;
  /** Name of the table this column belongs to */
  tableName: string;
  /** Name of the schema containing the table */
  schemaName?: string;
  /** Column description/comment from the database */
  description?: string;
  /** The type of table this column belongs to */
  tableType: ZodDbsTableType;
  /** If isEnum is true, contains the possible enum values */
  enumValues?: string[];
  /** Whether this column represents an enumeration type */
  isEnum: boolean;
  /** Whether this column is a serial/auto-incrementing column */
  isSerial: boolean;
  /** Whether this column is an array type */
  isArray: boolean;
  /**
   * Whether this column should be included in insert/update schemas.
   * Typically false for serial columns, primary keys, or other read-only columns.
   */
  isWritable?: boolean;
  /**
   * Whether this property is marked as deprecated.
   * Can be used to generate @deprecated JSDoc comments.
   */
  isDeprecated?: boolean;
  /**
   * If isDeprecated is true, this provides the reason for deprecation.
   */
  isDeprecatedReason?: string;
  /**
   * Object structure for JSON or object column types.
   */
  objectDefinition?: ZodDbsTable;
}

/**
 * Represents a database column with additional metadata used for Zod schema generation.
 */
export interface ZodDbsColumn extends ZodDbsColumnInfo {
  /**
   * Whether this column should be included in insert/update schemas.
   * Typically false for serial columns, primary keys, or other read-only columns.
   */
  isWritable: boolean;
  /**
   * Whether the field is optional in the Zod read schemas.
   * Defaults to true if the column is nullable.
   */
  isReadOptional: boolean;
  /**
   * Whether the field is optional in the Zod write schemas.
   * Defaults to true if the column is nullable or has a default value.
   */
  isWriteOptional: boolean;
  /**
   * The mapped Zod type ( usually derived from the dataType ).
   * This type is used to render the appropriate Zod schema (e.g., z.string(), z.number(), z.date()).
   */
  type: ZodDbsColumnType;
  /**
   * Additional transforms applied to the column.
   * These are used provide rendering hints the Zod type during rendering the write schema.
   * Examples: using 'trim' for a text field should output z.string().trim() for the property.
   */
  writeTransforms?: ZodDbsTransform[];
}

/**
 * Represents a configuration option supported by a database provider.
 * Usually used by CLI tools to generate prompts or validate config files.
 */
export interface ZodDbsProviderOption {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required?: boolean;
  allowedValues?: string[];
}

/**
 * Represents a provider that returns schema information that will be used to generate Zod schemas.
 */
export interface ZodDbsProvider {
  /**
   * The name of the database provider (e.g., 'pg', 'mysql', 'sqlite', etc.)
   */
  name: string;
  /**
   * The display name of the provider, used for user-friendly output.
   * For example, 'PostgreSQL', 'MySQL', etc.
   */
  displayName?: string;
  /**
   * Configuration options supported by this provider.
   * Used by CLI tools to generate prompts or validate config files.
   */
  options?: ZodDbsProviderOption[];
  /**
   * Fetches schema information from the database.
   */
  getSchemaInformation: (
    config: ZodDbsProviderConfig
  ) => Promise<ZodDbsSchemaInfo>;
}

/**
 * Represents a rendered file containing generated Zod schemas and types.
 */
export interface ZodDbsRenderedFile {
  /** The file name (without extension) */
  name: string;
  /** The file content */
  content: string;
}

/**
 * Interface for rendering Zod schemas and types from table information.
 */
export interface ZodDbsRenderer {
  /**
   * Renders the TypeScript code for the generated Zod schemas and types for a given table.
   */
  renderSchemaFiles: (
    table: ZodDbsTable,
    config: ZodDbsConfig
  ) => Promise<ZodDbsRenderedFile[]>;
}

/**
 * Available casing options for generated names.
 */
export type ZodDbsCasing =
  | 'PascalCase' // FirstLetterUppercase
  | 'camelCase' // firstLetterLowercase
  | 'snake_case'; // all_lowercase_with_underscores

/**
 * Available casing options for generated field names.
 */
export type ZodDbsFieldCasing = ZodDbsCasing | 'passthrough';

/**
 * Mapped Zod column types.
 */
export type ZodDbsColumnType =
  | 'email' // String with email validation
  | 'url' // String with URL validation
  | 'string' // Basic string type
  | 'int' // Integer number
  | 'number' // Decimal number
  | 'boolean' // Boolean value
  | 'date' // Date object
  | 'uuid' // String with UUID validation
  | 'json' // JSON object
  | 'object' // Generic object
  | 'unknown' // Unknown type
  | 'any'; // Any type (fallback)

/**
 * Supported Zod versions for code generation.
 */
export type ZodDbsZodVersion = '3' | '4' | '4-mini';

export interface ZodDbsHooks {
  /**
   * Hook called during the schema generation process.
   */
  onProgress?: (
    status: string,
    args?: { [key: string]: unknown; total?: number; index?: number }
  ) => void;

  /**
   * Hook called for each column after initial model creation from the database schema.
   * Allows customization of individual column properties and Zod types.
   */
  onColumnModelCreated?: (
    column: ZodDbsColumn
  ) => ZodDbsColumn | Promise<ZodDbsColumn>;

  /**
   * Hook called for each table after information is fetched from the database and columns are processed.
   * Allows customization of the entire table model.
   */
  onTableModelCreated?: (
    table: ZodDbsTable
  ) => ZodDbsTable | Promise<ZodDbsTable>;
}

/**
 * Interface representing a database client/connection.
 * This interface is usually implemented by specific database providers to handle connections and queries.
 */
export interface ZodDbsDatabaseClient {
  connect: () => Promise<void>;
  query: <T>(query: string, params?: any[]) => Promise<T>;
  end: () => Promise<void>;
}

/**
 * Base configuration interface for database providers.
 * This interface is usually extended by specific providers to include additional options.
 */
export interface ZodDbsProviderConfig extends ZodDbsHooks {
  /** Regex pattern(s) to include only specific tables */
  include?: string | string[];
  /** Regex pattern(s) to exclude specific tables */
  exclude?: string | string[];
  /** If true, will log debug information to the console */
  debug?: boolean;
}

/**
 * Main configuration interface for zod-dbs schema generation.
 * This interface defines all available options for customizing the generation process.
 */
export interface ZodDbsConfig extends ZodDbsProviderConfig {
  /** Whether to clean the output directory before generation */
  cleanOutput?: boolean;
  /** Regex pattern(s) to include only specific tables */
  include?: string | string[];
  /** Regex pattern(s) to exclude specific tables */
  exclude?: string | string[];

  /** Import location for JSON schemas (enables JSON schema feature) */
  jsonSchemaImportLocation?: string;

  /** Whether to stringify JSON values in write schemas */
  stringifyJson?: boolean;
  /** Whether to convert dates to ISO strings in write schemas */
  stringifyDates?: boolean;
  /** Whether to use z.coerce.date() instead of z.date() in read schemas */
  coerceDates?: boolean;
  /** Whether to provide empty arrays as defaults for nullable array fields */
  defaultEmptyArray?: boolean;
  /** Whether to transform null values to undefined in generated read schemas */
  defaultNullsToUndefined?: boolean;
  /** Whether to use "unknown" for unknown types, defaults to "any" */
  defaultUnknown?: boolean;

  /** Target Zod version for generated code */
  zodVersion?: ZodDbsZodVersion;

  /** Casing style for field names in generated schemas */
  fieldNameCasing?: ZodDbsFieldCasing;
  /** Casing style for object/type names in generated schemas */
  objectNameCasing?: ZodDbsCasing;
  /** Whether to enable case transformations for generated schemas */
  caseTransform?: boolean;
  /** Whether to enable singularization of table names / types in generated schemas */
  singularization?: boolean;

  /** Whether to suppress console output during generation */
  silent?: boolean;
  /** Module resolution strategy (affects import statements) */
  moduleResolution?: 'esm' | 'commonjs';
  /** Output directory for generated files */
  outputDir?: string;
}
