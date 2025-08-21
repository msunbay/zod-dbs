import { isArrayType, isSerialType } from '../../../src/utils.js';

describe('isArrayType', () => {
  it('should return true for array types (udtName starting with underscore)', () => {
    expect(isArrayType('_text')).toBe(true);
  });

  it('should return true for various array types', () => {
    const arrayTypes = ['_int4', '_varchar', '_numeric', '_bool', '_uuid'];

    arrayTypes.forEach((udtName) => {
      expect(isArrayType(udtName)).toBe(true);
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
      expect(isArrayType(udtName)).toBe(false);
    });
  });

  it('should return false for empty string', () => {
    expect(isArrayType('')).toBe(false);
  });

  it('should return false for udtName containing underscore but not at start', () => {
    expect(isArrayType('test_type')).toBe(false);
  });
});

describe('isSerialType', () => {
  it('should return true for serial udtName types', () => {
    const serialTypes = ['serial', 'serial4', 'serial8', 'bigserial'];

    serialTypes.forEach((udtName) => {
      expect(isSerialType(udtName, null)).toBe(true);
    });
  });

  it('should return true for columns with nextval default value', () => {
    const defaultValues = [
      "nextval('users_id_seq'::regclass)",
      "NEXTVAL('sequence_name'::regclass)",
      "nextval('public.posts_id_seq'::regclass)",
    ];

    defaultValues.forEach((defaultValue) => {
      expect(isSerialType('int4', defaultValue)).toBe(true);
    });
  });

  it('should return false for non-serial types without nextval', () => {
    const nonSerialTypes = ['text', 'int4', 'varchar', 'numeric', 'bool'];

    nonSerialTypes.forEach((udtName) => {
      expect(isSerialType(udtName)).toBe(false);
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
      expect(isSerialType('text', defaultValue)).toBe(false);
    });
  });

  it('should return false for undefined defaultValue', () => {
    expect(isSerialType('int4', undefined)).toBe(false);
  });

  it('should handle case insensitive nextval matching', () => {
    expect(isSerialType('int4', "NEXTVAL('seq'::regclass)")).toBe(true);
  });
});
