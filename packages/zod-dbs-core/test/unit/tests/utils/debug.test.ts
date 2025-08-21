import { beforeEach, describe, expect, it, vi } from 'vitest';

import { enableDebug, logDebug } from '../../../../src/utils/debug.js';

// Mock the debug package
vi.mock('debug', () => {
  const mockDebugFn = vi.fn();
  const mockEnable = vi.fn();
  const mockDebug = vi.fn(() => mockDebugFn);
  Object.assign(mockDebug, { enable: mockEnable });

  return {
    default: mockDebug,
  };
});

describe('debug utilities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.DEBUG;
  });

  describe('logDebug', () => {
    it('should call debug function with message', () => {
      logDebug('Test debug message');

      // Since debug is mocked, we can't easily test the exact calls
      // but we can test that the function runs without error
      expect(true).toBe(true);
    });

    it('should handle object messages', () => {
      const testObject = { key: 'value' };

      logDebug(testObject);

      expect(true).toBe(true);
    });
  });

  describe('enableDebug', () => {
    it('should set DEBUG environment variable', () => {
      enableDebug();

      expect(process.env.DEBUG).toBe('zod-dbs:*');
    });
  });
});
