import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createProgressHandler } from '../../../../src/utils/progress.js';

// Mock ora spinner
const mockStart = vi.fn();
const mockSucceed = vi.fn();
const mockFail = vi.fn();
const mockStop = vi.fn();

const mockSpinner = {
  start: mockStart,
  succeed: mockSucceed,
  fail: mockFail,
  stop: mockStop,
  isSpinning: false,
};

vi.mock('ora', () => ({
  default: vi.fn(() => mockSpinner),
}));

// Mock mustache
vi.mock('mustache', () => ({
  default: {
    render: vi.fn((template: string, args: any) =>
      template.replace('{{total}}', args?.total || '')
    ),
  },
}));

describe('progress utilities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('createProgressHandler', () => {
    it('should create progress handler with onProgress, done, and fail methods', () => {
      const handler = createProgressHandler();

      expect(handler).toHaveProperty('onProgress');
      expect(handler).toHaveProperty('done');
      expect(handler).toHaveProperty('fail');
    });

    it('should return silent handler when silent flag is true', () => {
      const handler = createProgressHandler(true);

      handler.onProgress('connecting');
      handler.done();
      handler.fail();

      // Silent handler should not call any ora methods
      expect(mockStart).not.toHaveBeenCalled();
      expect(mockSucceed).not.toHaveBeenCalled();
      expect(mockFail).not.toHaveBeenCalled();
    });

    it('should start spinner with connecting status', () => {
      const handler = createProgressHandler();

      handler.onProgress('connecting');

      expect(mockStart).toHaveBeenCalledWith(
        'Connecting to Postgres database...'
      );
    });

    it('should start spinner with generating status and template args', () => {
      const handler = createProgressHandler();

      handler.onProgress('generating', { total: 5 });

      expect(mockStart).toHaveBeenCalledWith('Generating 5 Zod schemas...');
    });

    it('should call succeed when done', () => {
      const handler = createProgressHandler();

      handler.done();

      expect(mockSucceed).toHaveBeenCalled();
    });

    it('should call fail when failed', () => {
      const handler = createProgressHandler();

      handler.fail();

      expect(mockFail).toHaveBeenCalled();
    });
  });
});
