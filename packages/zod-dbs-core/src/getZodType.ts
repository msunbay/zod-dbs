import { ZodDbsColumnType } from './types.js';

export const getZodType = (dataType: string): ZodDbsColumnType => {
  // Normalize the data type to handle variations
  const lowercaseDataType = dataType.toLowerCase();

  let normalizedType = lowercaseDataType.startsWith('_')
    ? lowercaseDataType.slice(1) // Remove leading underscore for array types
    : lowercaseDataType;

  // Remove ending numbers from types like varchar(255) => varchar
  normalizedType = normalizedType.replace(/\(\d+\)$/, '');

  // Remove ending numbers from types like int128 => int
  normalizedType = normalizedType.replace(/\d+$/, '');

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
    case 'objectid':
    case 'name':
    case 'time':
    case 'timetz':
    case 'string':
      return 'string';
    case 'int':
    case 'integer':
    case 'long':
    case 'smallint':
    case 'bigint':
    case 'mediumint':
    case 'tinyint':
    case 'year':
    case 'serial':
    case 'bigserial':
      return 'int';
    case 'real':
    case 'float':
    case 'decimal':
    case 'double':
    case 'double precision':
    case 'numeric':
    case 'number':
    case 'money':
      return 'number';
    case 'bool':
    case 'boolean':
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
    case 'object':
      return 'object';
    case 'unknown':
      return 'unknown';
    default:
      // If the type is not recognized, return 'any'
      return 'any';
  }
};
