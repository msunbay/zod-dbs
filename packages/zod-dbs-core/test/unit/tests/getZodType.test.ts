import { getZodType } from '../../../src/getZodType.js';

describe('getZodType', () => {
  describe('string types', () => {
    it('should return "string" for text-based types', () => {
      const stringTypes = [
        'text',
        'varchar',
        'bpchar',
        'bytea',
        'inet',
        'cidr',
        'macaddr',
        'point',
        'polygon',
        'circle',
        'name',
        'time',
        'timetz',
      ];

      stringTypes.forEach((udtName) => {
        expect(getZodType(udtName)).toBe('string');
      });
    });

    it('should handle uppercase udtName for string types', () => {
      expect(getZodType('TEXT')).toBe('string');
    });

    it('should handle mixed case udtName for string types', () => {
      expect(getZodType('VarChar')).toBe('string');
    });
  });

  describe('integer types', () => {
    it('should return "int" for integer types', () => {
      const intTypes = [
        'int2',
        'int4',
        'int8',
        'serial',
        'serial4',
        'serial8',
        'bigserial',
      ];

      intTypes.forEach((udtName) => {
        expect(getZodType(udtName)).toBe('int');
      });
    });

    it('should handle uppercase udtName for integer types', () => {
      expect(getZodType('INT4')).toBe('int');
    });
  });

  describe('number types', () => {
    it('should return "number" for numeric types', () => {
      const numberTypes = ['float4', 'float8', 'numeric', 'money'];

      numberTypes.forEach((udtName) => {
        expect(getZodType(udtName)).toBe('number');
      });
    });

    it('should handle uppercase udtName for number types', () => {
      expect(getZodType('NUMERIC')).toBe('number');
    });
  });

  describe('boolean types', () => {
    it('should return "boolean" for bool type', () => {
      expect(getZodType('bool')).toBe('boolean');
    });

    it('should handle uppercase udtName for boolean types', () => {
      expect(getZodType('BOOL')).toBe('boolean');
    });
  });

  describe('date types', () => {
    it('should return "date" for date/time types', () => {
      const dateTypes = ['timestamptz', 'timestamp', 'date'];

      dateTypes.forEach((udtName) => {
        expect(getZodType(udtName)).toBe('date');
      });
    });

    it('should handle uppercase udtName for date types', () => {
      expect(getZodType('TIMESTAMPTZ')).toBe('date');
    });
  });

  describe('uuid types', () => {
    it('should return "uuid" for uuid type', () => {
      expect(getZodType('uuid')).toBe('uuid');
    });

    it('should handle uppercase udtName for uuid types', () => {
      expect(getZodType('UUID')).toBe('uuid');
    });
  });

  describe('json types', () => {
    it('should return "json" for json types', () => {
      const jsonTypes = ['jsonb', 'json'];

      jsonTypes.forEach((udtName) => {
        expect(getZodType(udtName)).toBe('json');
      });
    });

    it('should handle uppercase udtName for json types', () => {
      expect(getZodType('JSONB')).toBe('json');
    });
  });

  describe('array type handling', () => {
    it('should handle array types by removing leading underscore', () => {
      const arrayMappings = [
        { udtName: '_text', expected: 'string' },
        { udtName: '_int4', expected: 'int' },
        { udtName: '_numeric', expected: 'number' },
        { udtName: '_bool', expected: 'boolean' },
        { udtName: '_timestamp', expected: 'date' },
        { udtName: '_uuid', expected: 'uuid' },
        { udtName: '_jsonb', expected: 'json' },
      ];

      arrayMappings.forEach(({ udtName, expected }) => {
        expect(getZodType(udtName)).toBe(expected);
      });
    });

    it('should handle uppercase array types', () => {
      expect(getZodType('_TEXT')).toBe('string');
    });

    it('should handle mixed case array types', () => {
      expect(getZodType('_VarChar')).toBe('string');
      expect(getZodType('_VARCHAR')).toBe('string');
    });
  });

  describe('unknown types', () => {
    it('should return "any" for unrecognized types', () => {
      const unknownTypes = [
        'unknown_type',
        'custom_enum',
        'geometry',
        'tsvector',
        'xml',
      ];

      unknownTypes.forEach((udtName) => {
        expect(getZodType(udtName)).toBe('any');
      });
    });

    it('should return "any" for empty string', () => {
      expect(getZodType('')).toBe('any');
    });

    it('should return "any" for array of unknown types', () => {
      expect(getZodType('_unknown_type')).toBe('any');
    });
  });

  describe('edge cases', () => {
    it('should handle types with special characters', () => {
      expect(getZodType('type-with-dash')).toBe('any');
    });

    it('should handle very long type names', () => {
      const longTypeName = 'a'.repeat(100);
      expect(getZodType(longTypeName)).toBe('any');
    });

    it('should handle types with numbers', () => {
      expect(getZodType('type123')).toBe('any');
    });
  });
});
