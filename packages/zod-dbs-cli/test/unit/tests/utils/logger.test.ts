import {
  logAppName,
  logError,
  logSetting,
  logWarning,
} from '../../../../src/utils/logger.js';

// Mock console methods
const mockConsoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
const mockConsoleError = vi
  .spyOn(console, 'error')
  .mockImplementation(() => {});
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    white: (str: string) => `white(${str})`,
    blue: (str: string) => `blue(${str})`,
    magenta: (str: string) => `magenta(${str})`,
    red: (str: string) => `red(${str})`,
  },
}));

describe('logger utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logSetting', () => {
    it('should log setting with name and value', () => {
      logSetting('database', 'postgresql://localhost:5432/test');

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        '- white(database): blue(postgresql://localhost:5432/test)'
      );
    });
  });

  describe('logAppName', () => {
    it('should log app name with magenta color and newlines', () => {
      logAppName('zod-dbs v1.0.0');

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'magenta(\nzod-dbs v1.0.0\n)'
      );
    });
  });

  describe('logError', () => {
    it('should log error message with red color', () => {
      logError('Database connection failed');

      expect(mockConsoleError).toHaveBeenCalledWith(
        'red(Database connection failed)'
      );
    });
  });

  describe('logWarning', () => {
    it('should log warning message with warning emoji', () => {
      logWarning('Deprecated feature used');

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '⚠️ Deprecated feature used'
      );
    });
  });
});
