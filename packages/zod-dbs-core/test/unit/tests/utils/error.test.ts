import { toError } from '../../../../src/utils/error.js';

describe('toError', () => {
  it('should return Error as-is when input is an Error', () => {
    const originalError = new Error('Test error message');

    const result = toError(originalError);

    expect(result).toBe(originalError);
    expect(result.message).toBe('Test error message');
  });

  it('should extract first error from errors array when available', () => {
    const errorWithErrors = new Error('Main error') as Error & {
      errors: string[];
    };
    errorWithErrors.errors = ['First error', 'Second error'];

    const result = toError(errorWithErrors);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('First error');
    expect(result).not.toBe(errorWithErrors); // Should be a new Error instance
  });

  it('should handle empty errors array', () => {
    const errorWithErrors = new Error('Main error') as Error & {
      errors: string[];
    };
    errorWithErrors.errors = [];

    const result = toError(errorWithErrors);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe(''); // new Error(undefined) results in empty string
  });

  it('should handle non-array errors property', () => {
    const errorWithErrors = new Error('Main error') as Error & {
      errors: string;
    };
    errorWithErrors.errors = 'Not an array';

    const result = toError(errorWithErrors);

    expect(result).toBe(errorWithErrors); // Should return original error
    expect(result.message).toBe('Main error');
  });

  it('should convert string to Error', () => {
    const result = toError('String error message');

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('String error message');
  });

  it('should convert number to Error', () => {
    const result = toError(404);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('404');
  });

  it('should convert boolean to Error', () => {
    const result = toError(false);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('false');
  });

  it('should convert null to Error', () => {
    const result = toError(null);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('null');
  });

  it('should convert undefined to Error', () => {
    const result = toError(undefined);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('undefined');
  });

  it('should convert object to Error', () => {
    const obj = { message: 'Object error', code: 500 };

    const result = toError(obj);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('[object Object]');
  });

  it('should handle object with toString method', () => {
    const obj = {
      toString: () => 'Custom toString',
    };

    const result = toError(obj);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Custom toString');
  });
});
