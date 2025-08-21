import {
  getZodType,
  isArrayType,
  isSerialType,
} from '../../../../src/database/typeMap.js';
import { ZodDbsRawColumnInfo, ZodDbsTableType } from '../../../../src/types.js';

// Helper function to create a mock column info
const createMockColumn = (
  overrides: Partial<ZodDbsRawColumnInfo> = {}
): ZodDbsRawColumnInfo => ({
  name: 'test_column',
  dataType: 'text',
  isNullable: false,
  tableName: 'test_table',
  schemaName: 'public',
  tableType: 'table' as ZodDbsTableType,
  ...overrides,
});

describe('typeMap', () => {
  describe('isArrayType', () => {
    it('should return true for array types (udtName starting with underscore)', () => {
      const column = createMockColumn({ dataType: '_text' });
      expect(isArrayType(column)).toBe(true);
    });

    it('should return true for various array types', () => {
      const arrayTypes = ['_int4', '_varchar', '_numeric', '_bool', '_uuid'];

      arrayTypes.forEach((udtName) => {
        const column = createMockColumn({ dataType: udtName });
        expect(isArrayType(column)).toBe(true);
      });
    });

    it('should return false for non-array types', () => {
      const nonArrayTypes = [
        'text',
        'int4',
        'varchar',
        'numeric',
        'bool',
        'uuid',
      ];

      nonArrayTypes.forEach((udtName) => {
        const column = createMockColumn({ dataType: udtName });
        expect(isArrayType(column)).toBe(false);
      });
    });

    it('should return false for empty string', () => {
      const column = createMockColumn({ dataType: '' });
      expect(isArrayType(column)).toBe(false);
    });

    it('should return false for udtName containing underscore but not at start', () => {
      const column = createMockColumn({ dataType: 'test_type' });
      expect(isArrayType(column)).toBe(false);
    });
  });

  describe('isSerialType', () => {
    it('should return true for serial udtName types', () => {
      const serialTypes = ['serial', 'serial4', 'serial8', 'bigserial'];

      serialTypes.forEach((udtName) => {
        const column = createMockColumn({ dataType: udtName });
        expect(isSerialType(column)).toBe(true);
      });
    });

    it('should return true for columns with nextval default value', () => {
      const defaultValues = [
        "nextval('users_id_seq'::regclass)",
        "NEXTVAL('sequence_name'::regclass)",
        "nextval('public.posts_id_seq'::regclass)",
      ];

      defaultValues.forEach((defaultValue) => {
        const column = createMockColumn({
          dataType: 'int4',
          defaultValue,
        });
        expect(isSerialType(column)).toBe(true);
      });
    });

    it('should return false for non-serial types without nextval', () => {
      const nonSerialTypes = ['text', 'int4', 'varchar', 'numeric', 'bool'];

      nonSerialTypes.forEach((udtName) => {
        const column = createMockColumn({ dataType: udtName });
        expect(isSerialType(column)).toBe(false);
      });
    });

    it('should return false for columns with non-nextval default values', () => {
      const defaultValues = [
        "'default_text'",
        '0',
        'CURRENT_TIMESTAMP',
        'gen_random_uuid()',
        'false',
      ];

      defaultValues.forEach((defaultValue) => {
        const column = createMockColumn({
          dataType: 'text',
          defaultValue,
        });
        expect(isSerialType(column)).toBe(false);
      });
    });

    it('should return false for undefined defaultValue', () => {
      const column = createMockColumn({
        dataType: 'int4',
        defaultValue: undefined,
      });
      expect(isSerialType(column)).toBe(false);
    });

    it('should handle case insensitive nextval matching', () => {
      const column = createMockColumn({
        dataType: 'int4',
        defaultValue: "NEXTVAL('seq'::regclass)",
      });
      expect(isSerialType(column)).toBe(true);
    });
  });

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
          const column = createMockColumn({ dataType: udtName });
          expect(getZodType(column)).toBe('string');
        });
      });

      it('should handle uppercase udtName for string types', () => {
        const column = createMockColumn({ dataType: 'TEXT' });
        expect(getZodType(column)).toBe('string');
      });

      it('should handle mixed case udtName for string types', () => {
        const column = createMockColumn({ dataType: 'VarChar' });
        expect(getZodType(column)).toBe('string');
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
          const column = createMockColumn({ dataType: udtName });
          expect(getZodType(column)).toBe('int');
        });
      });

      it('should handle uppercase udtName for integer types', () => {
        const column = createMockColumn({ dataType: 'INT4' });
        expect(getZodType(column)).toBe('int');
      });
    });

    describe('number types', () => {
      it('should return "number" for numeric types', () => {
        const numberTypes = ['float4', 'float8', 'numeric', 'money'];

        numberTypes.forEach((udtName) => {
          const column = createMockColumn({ dataType: udtName });
          expect(getZodType(column)).toBe('number');
        });
      });

      it('should handle uppercase udtName for number types', () => {
        const column = createMockColumn({ dataType: 'NUMERIC' });
        expect(getZodType(column)).toBe('number');
      });
    });

    describe('boolean types', () => {
      it('should return "boolean" for bool type', () => {
        const column = createMockColumn({ dataType: 'bool' });
        expect(getZodType(column)).toBe('boolean');
      });

      it('should handle uppercase udtName for boolean types', () => {
        const column = createMockColumn({ dataType: 'BOOL' });
        expect(getZodType(column)).toBe('boolean');
      });
    });

    describe('date types', () => {
      it('should return "date" for date/time types', () => {
        const dateTypes = ['timestamptz', 'timestamp', 'date'];

        dateTypes.forEach((udtName) => {
          const column = createMockColumn({ dataType: udtName });
          expect(getZodType(column)).toBe('date');
        });
      });

      it('should handle uppercase udtName for date types', () => {
        const column = createMockColumn({ dataType: 'TIMESTAMPTZ' });
        expect(getZodType(column)).toBe('date');
      });
    });

    describe('uuid types', () => {
      it('should return "uuid" for uuid type', () => {
        const column = createMockColumn({ dataType: 'uuid' });
        expect(getZodType(column)).toBe('uuid');
      });

      it('should handle uppercase udtName for uuid types', () => {
        const column = createMockColumn({ dataType: 'UUID' });
        expect(getZodType(column)).toBe('uuid');
      });
    });

    describe('json types', () => {
      it('should return "json" for json types', () => {
        const jsonTypes = ['jsonb', 'json'];

        jsonTypes.forEach((udtName) => {
          const column = createMockColumn({ dataType: udtName });
          expect(getZodType(column)).toBe('json');
        });
      });

      it('should handle uppercase udtName for json types', () => {
        const column = createMockColumn({ dataType: 'JSONB' });
        expect(getZodType(column)).toBe('json');
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
          const column = createMockColumn({ dataType: udtName });
          expect(getZodType(column)).toBe(expected);
        });
      });

      it('should handle uppercase array types', () => {
        const column = createMockColumn({ dataType: '_TEXT' });
        expect(getZodType(column)).toBe('string');
      });

      it('should handle mixed case array types', () => {
        const column = createMockColumn({ dataType: '_VarChar' });
        expect(getZodType(column)).toBe('string');
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
          const column = createMockColumn({ dataType: udtName });
          expect(getZodType(column)).toBe('any');
        });
      });

      it('should return "any" for empty string', () => {
        const column = createMockColumn({ dataType: '' });
        expect(getZodType(column)).toBe('any');
      });

      it('should return "any" for array of unknown types', () => {
        const column = createMockColumn({ dataType: '_unknown_type' });
        expect(getZodType(column)).toBe('any');
      });
    });

    describe('edge cases', () => {
      it('should handle types with special characters', () => {
        const column = createMockColumn({ dataType: 'type-with-dash' });
        expect(getZodType(column)).toBe('any');
      });

      it('should handle very long type names', () => {
        const longTypeName = 'a'.repeat(100);
        const column = createMockColumn({ dataType: longTypeName });
        expect(getZodType(column)).toBe('any');
      });

      it('should handle types with numbers', () => {
        const column = createMockColumn({ dataType: 'type123' });
        expect(getZodType(column)).toBe('any');
      });
    });
  });
});
