import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Resolve module paths relative to package
const pkgRoot = path.resolve(__dirname, '../../../');
const cliPath = path.resolve(pkgRoot, 'src', 'cli.ts');

// Mock generateZodSchemas from the published package name
const generateMock = vi.fn(async () => Promise.resolve());
vi.mock('zod-dbs', () => ({ generateZodSchemas: generateMock }));

// Mock getConfiguration to return a controlled config object
const cfgMock = vi.fn(async () => ({
  provider: 'mysql',
  outputDir: './config-out',
  caseTransform: true,
}));

// Use a string literal module id so vitest can hoist the mock
vi.mock('../../../src/config.js', () => ({
  detectDebugMode: () => {},
  getConfiguration: cfgMock,
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logAppName: () => {},
  logError: () => {},
  logSetting: () => {},
  logEmpty: () => {},
}));

// Mock progress handler so spinner methods don't interfere
// Use a string literal module id so vitest can hoist the mock
vi.mock('../../../src/utils/progress.js', () => ({
  createProgressHandler: () => ({
    onProgress: () => {},
    done: () => {},
    fail: () => {},
  }),
}));

// Silence logger functions imported by CLI (they are harmless but noisy)
vi.mock('zod-dbs-core', () => ({
  logDebug: () => {},
  toError: (e: any) => (e instanceof Error ? e : new Error(String(e))),
}));

describe('runCli config merging', () => {
  let originalArgv: string[];

  beforeEach(() => {
    originalArgv = process.argv.slice();
    generateMock.mockClear();
    cfgMock.mockClear();
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.resetModules();
  });

  it('applies explicit CLI flags over config values', async () => {
    // Simulate passing explicit --no-case-transform and --output-dir
    process.argv = [
      'node',
      'zod-dbs',
      '--no-case-transform',
      '--output-dir',
      './cli-out',
    ];

    // Import the CLI after mocks are registered
    const { runCli } = await import(cliPath);

    // Provide a provider override so loadProvider does not attempt to import
    const provider = {
      name: 'mysql',
      displayName: 'MySQL',
      options: [],
    } as any;

    await runCli({
      overrides: { provider, appName: 'test-cli', appVersion: '0.0.0' },
    });

    expect(generateMock).toHaveBeenCalledTimes(1);
    const call = (generateMock as any).mock.calls[0]?.[0] as any;
    // CLI explicitly set outputDir to ./cli-out
    expect(call.config.outputDir).toBe('./cli-out');
    // CLI explicitly provided --no-case-transform, so caseTransform should be false
    // Note: CLI passes through cleaned options, so final config should reflect the explicit flag
    expect(call.config.caseTransform).toBe(false);
  });

  it('keeps config values when no CLI flags provided', async () => {
    process.argv = ['node', 'zod-dbs'];

    const { runCli } = await import(cliPath);
    const provider = {
      name: 'mysql',
      displayName: 'MySQL',
      options: [],
    } as any;

    await runCli({
      overrides: { provider, appName: 'test-cli', appVersion: '0.0.0' },
    });

    expect(generateMock).toHaveBeenCalledTimes(1);
    const call = (generateMock as any).mock.calls[0]?.[0] as any;
    // No CLI override, so outputDir should come from mocked config
    expect(call.config.outputDir).toBe('./config-out');
    // No CLI override, so caseTransform should come from mocked config
    expect(call.config.caseTransform).toBe(true);
  });
});
