/**
 * Represents the overall schema information for a PostgreSQL database schema.
 */
export interface ZodDbsSchemaInfo {
  /** The name of the database schema (e.g., 'public') */
  name: string;
  /** Array of all tables found in the schema */
  tables: ZodDbsTableInfo[];
}

/**
 * Represents basic information about a PostgreSQL table, view, or other relation.
 * This is the raw data structure before any processing or model creation.
 */
export interface ZodDbsTableInfo {
  /** The type of relation (table, view, materialized view, etc.) */
  type: ZodDbsTableType;
  /** The name of the table/relation */
  name: string;
  /** The schema name where this table resides */
  schemaName: string;
  /** Array of all columns in this table */
  columns: ZodDbsColumnInfo[];
}

/**
 * Enum representing the different types of PostgreSQL relations that can be processed.
 */
export type ZodDbsTableType =
  | 'table' // Regular table
  | 'view' // Database view
  | 'materialized_view' // Materialized view
  | 'foreign_table' // Foreign data wrapper table
  | 'unknown'; // Unknown or unsupported type

/**
 * Transform types that can be applied to Zod schemas.
 */
export type ZodDbsTransform =
  | 'trim'
  | 'lowercase'
  | 'uppercase'
  | 'normalize'
  | 'nonnegative';

/**
 * Raw column information directly from PostgreSQL system catalogs.
 * This interface represents the unprocessed data about a database column.
 */
export interface ZodDbsRawColumnInfo {
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
   *
   * Examples:
   * - Built-in types: 'varchar', 'int4', 'text', 'bool', 'timestamp', 'timestamptz', 'jsonb', 'uuid'
   * - Array types: '_text' (text[]), '_int4' (integer[]), '_varchar' (varchar[])
   * - Serial types: 'int4' with serial default, 'int8' with bigserial default
   * - Custom types: User-defined enum names, composite types, domain types
   *
   * This value is used by the type mapping system to determine the appropriate Zod schema type.
   * Array types are detected by the leading underscore prefix.
   */
  dataType: string;
  /** Name of the table this column belongs to */
  tableName: string;
  /** Name of the schema containing the table */
  schemaName: string;
  /** Column description/comment from the database */
  description?: string;
  /** Check constraints applied to this column */
  checkConstraints?: { checkClause: string }[];
  /** The type of table this column belongs to */
  tableType: ZodDbsTableType;
}

/**
 * Enhanced column information with additional metadata derived from the raw column data.
 * This extends the raw column info with processed information about types and characteristics.
 */
export interface ZodDbsColumnInfo extends ZodDbsRawColumnInfo {
  /**
   * The mapped Zod type derived from the PostgreSQL dataType.
   *
   * This represents the high-level category that the PostgreSQL type maps to in the Zod schema system.
   * The type mapping logic analyzes the `dataType` field and converts it to one of these standardized types.
   *
   * Examples of mapping:
   * - 'varchar', 'text', 'bpchar' → 'string'
   * - 'int4', 'int8', 'smallint' → 'int'
   * - 'numeric', 'decimal', 'real' → 'number'
   * - 'bool' → 'boolean'
   * - 'timestamp', 'timestamptz', 'date' → 'date'
   * - 'uuid' → 'uuid'
   * - 'jsonb', 'json' → 'json'
   * - Email-like varchar columns → 'email' (if detected)
   * - URL-like varchar columns → 'url' (if detected)
   * - Unknown/unsupported types → 'any'
   *
   * This mapped type is used to generate the appropriate Zod schema (e.g., z.string(), z.number(), z.date()).
   */
  type: ZodDbsColumnType;
  /** If isEnum is true, contains the possible enum values */
  enumValues?: string[];
  /** Whether this column represents an enumeration type */
  isEnum: boolean;
  /** Whether this column is a serial/auto-incrementing column */
  isSerial: boolean;
  /** Whether this column is an array type */
  isArray: boolean;
  /**
   * Whether the field is optional in the Zod schema
   * Defaults to the same as isNullable.
   */
  isOptional?: boolean;
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
   * Additional transforms applied to the column.
   * These are used provide rendering hints the Zod type during rendering the write schema.
   * Examples: using 'trim' for a text field should output z.string().trim() for the property.
   */
  writeTransforms?: ZodDbsTransform[];
}

/**
 * Progress states during schema generation process.
 */
export type ZodDbsProgress =
  | 'connecting' // Establishing database connection
  | 'fetchingSchema' // Querying database metadata
  | 'generating' // Processing and generating schemas
  | 'done'; // Generation complete

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
   * Fetches schema information from the database.
   */
  getSchemaInformation: (
    config: ZodDbsConnectorConfig
  ) => Promise<ZodDbsSchemaInfo>;
}

export interface ZodDbsRenderer {
  /**
   * Renders the TypeScript code for the generated Zod schemas and types for a given table.
   */
  renderSchemaFile: (
    table: ZodDbsTableInfo,
    config: ZodDbsConfig
  ) => string | Promise<string>;
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
 * Mapped Zod column types that PostgreSQL types are converted to.
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
    status: ZodDbsProgress,
    args?: { total?: number; index?: number }
  ) => void;

  /**
   * Hook called for each column after initial model creation from the database schema.
   * Allows customization of individual column properties and Zod types.
   */
  onColumnModelCreated?: (
    column: ZodDbsColumnInfo
  ) => ZodDbsColumnInfo | Promise<ZodDbsColumnInfo>;

  /**
   * Hook called for each table after information is fetched from the database and columns are processed.
   * Allows customization of the entire table model.
   */
  onTableModelCreated?: (
    table: ZodDbsTableInfo
  ) => ZodDbsTableInfo | Promise<ZodDbsTableInfo>;
}

export interface ZodDbsSslConfig extends Record<string, any> {}

export interface ZodDbsDatabaseClient {
  connect: () => Promise<void>;
  query: <T>(query: string, params?: any[]) => Promise<T>;
  end: () => Promise<void>;
  config: ZodDbsConnectionConfig;
}

/**
 * Configuration for PostgreSQL database connection.
 */
export interface ZodDbsConnectionConfig {
  /** Database port (default: 5432) */
  port?: number;
  /** Database host (default: localhost) */
  host?: string;
  /** Database name to connect to */
  database?: string;
  /** Username for authentication */
  user?: string;
  /** Password for authentication */
  password?: string;
  /** Whether to use SSL connection */
  ssl?: boolean | ZodDbsSslConfig;
}

export interface ZodDbsConnectorConfig
  extends ZodDbsConnectionConfig,
    ZodDbsHooks {
  /** Database schema name to process (default: 'public') */
  schemaName?: string;
  /** Regex pattern(s) to include only specific tables */
  include?: string | string[];
  /** Regex pattern(s) to exclude specific tables */
  exclude?: string | string[];
}

/**
 * Main configuration interface for zod-dbs schema generation.
 * This interface defines all available options for customizing the generation process.
 */
export interface ZodDbsConfig extends ZodDbsConnectorConfig {
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
  /** Wheter to use "unknown" for unknown types, defaults to "any" */
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
  outputDir: string;
}
