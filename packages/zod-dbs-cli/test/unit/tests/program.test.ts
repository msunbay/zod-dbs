import path from 'node:path';

const pkgRoot = path.resolve(__dirname, '../../../');
const programPath = path.resolve(pkgRoot, 'src', 'program.ts');

describe('runCommander', () => {
  let originalArgv: string[];

  beforeEach(() => {
    originalArgv = process.argv.slice();
  });

  afterEach(() => {
    process.argv = originalArgv;
    // Clear module cache so commander/program state is reinitialized on import
    vi.resetModules();
  });

  it('parses basic CLI flags (output-dir, zod-version)', async () => {
    process.argv = [
      'node',
      'zod-dbs',
      '--output-dir',
      './out',
      '--zod-version',
      '4',
    ];

    const provider = { name: 'test', displayName: 'Test', options: [] } as any;

    const { runCommander } = await import(programPath);

    const cfg = runCommander({
      provider,
      appName: 'test',
      appVersion: '0.0.0',
      includeProviderOption: false,
    });

    expect(cfg).toStrictEqual({
      outputDir: './out',
      zodVersion: '4',
    });
  });

  it('adds provider-specific options and parses number/choice types', async () => {
    process.argv = [
      'node',
      'zod-dbs',
      '--limit',
      '10',
      '--mode',
      'b',
      '--flag',
    ];

    const provider = {
      name: 'prov',
      displayName: 'Prov',
      options: [
        { name: 'limit', type: 'number' },
        { name: 'mode', type: 'string', allowedValues: ['a', 'b'] },
        { name: 'flag', type: 'boolean' },
      ],
    } as any;

    const { runCommander } = await import(programPath);

    const cfg = runCommander({
      provider,
      appName: 'test',
      appVersion: '0.0.0',
      includeProviderOption: false,
    });

    expect(cfg).toStrictEqual({
      limit: 10,
      mode: 'b',
      flag: true,
    });
  });

  it('returns negated options (e.g., --no-case-transform results in false)', async () => {
    process.argv = ['node', 'zod-dbs', '--no-coerce-dates'];

    const provider = { name: 'p', displayName: 'P', options: [] } as any;

    const { runCommander } = await import(programPath);

    const cfg = runCommander({
      provider,
      appName: 'test',
      appVersion: '0.0.0',
      includeProviderOption: false,
    });

    expect(cfg).toStrictEqual({
      coerceDates: false,
    });
  });
});
