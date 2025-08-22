import { ZodDbsColumnType } from './types.js';

export const getZodType = (dataType: string): ZodDbsColumnType => {
  // Normalize the data type to handle variations
  const lowerUdtName = dataType.toLowerCase();

  const normalizedType = lowerUdtName.startsWith('_')
    ? lowerUdtName.slice(1) // Remove leading underscore for array types
    : lowerUdtName;

  switch (normalizedType) {
    case 'text':
    case 'tinytext':
    case 'mediumtext':
    case 'longtext':
    case 'varchar':
    case 'char':
    case 'nchar':
    case 'nvarchar':
    case 'character varying':
    case 'character':
    case 'bpchar':
    case 'bytea':
    case 'inet':
    case 'cidr':
    case 'macaddr':
    case 'point':
    case 'polygon':
    case 'circle':
    case 'name':
    case 'time':
    case 'timetz':
      return 'string';
    case 'int':
    case 'int2':
    case 'int4':
    case 'int8':
    case 'smallint':
    case 'bigint':
    case 'mediumint':
    case 'tinyint':
    case 'year':
    case 'serial':
    case 'serial4':
    case 'serial8':
    case 'bigserial':
      return 'int';
    case 'float':
    case 'float4':
    case 'float8':
    case 'decimal':
    case 'double':
    case 'double precision':
    case 'numeric':
    case 'money':
      return 'number';
    case 'bool':
      return 'boolean';
    case 'timestamptz':
    case 'timestamp':
    case 'date':
      return 'date';
    case 'uuid':
      return 'uuid';
    case 'jsonb':
    case 'json':
      return 'json';
    default:
      // If the type is not recognized, return 'any'
      return 'any';
  }
};
