import { cosmiconfig } from 'cosmiconfig';
import { DEFAULT_CONFIGURATION } from 'zod-dbs';

import { getConfiguration } from '../../../src/config.js';

// Mock cosmiconfig
vi.mock('cosmiconfig');

describe.sequential('getConfiguration', () => {
  const mockExplorer = {
    search: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(cosmiconfig).mockReturnValue(mockExplorer as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return default config when no configuration file is found', async () => {
    mockExplorer.search.mockResolvedValue(null);

    const config = await getConfiguration();

    expect(config).toEqual(DEFAULT_CONFIGURATION);
    expect(cosmiconfig).toHaveBeenCalledWith('zod-dbs');
  });

  it('should return merged config when configuration file is found (merging defaults for missing connection fields)', async () => {
    const mockConfig = {
      host: 'conf-host',
      port: 5432,
      user: 'conf-user',
      password: 'conf-pass',
      outputDir: './custom-output',
      schemaName: 'test_schema',
    };

    mockExplorer.search.mockResolvedValue({
      config: mockConfig,
      filepath: '/path/to/config',
    });

    const config = await getConfiguration();

    expect(config).toEqual({
      ...DEFAULT_CONFIGURATION,
      host: 'conf-host',
      port: 5432,
      user: 'conf-user',
      password: 'conf-pass',
      outputDir: './custom-output',
      schemaName: 'test_schema',
    });
  });

  it('should handle partial connection config', async () => {
    const mockConfig = {
      outputDir: './schemas',
      host: 'db.example.com',
    };

    mockExplorer.search.mockResolvedValue({
      config: mockConfig,
      filepath: '/path/to/config',
    });

    const config = await getConfiguration();

    expect(config).toEqual({
      ...DEFAULT_CONFIGURATION,
      host: 'db.example.com',
      outputDir: './schemas',
    });
  });

  it('should handle empty config object', async () => {
    mockExplorer.search.mockResolvedValue({
      config: {},
      filepath: '/path/to/config',
    });

    const config = await getConfiguration();

    expect(config).toEqual(DEFAULT_CONFIGURATION);
  });

  it('applies environment variable overrides for defaults (no config file)', async () => {
    mockExplorer.search.mockResolvedValue(null);
    process.env.POSTGRES_HOST = 'env-host';
    process.env.POSTGRES_USER = 'env-user';
    process.env.POSTGRES_PASSWORD = 'env-pass';
    process.env.POSTGRES_DB = 'env-db';
    process.env.POSTGRES_PORT = '6543';
    process.env.POSTGRES_SSL = 'true';

    const config = await getConfiguration();

    expect(config).toEqual({
      ...DEFAULT_CONFIGURATION,
      host: 'env-host',
      user: 'env-user',
      password: 'env-pass',
      database: 'env-db',
      port: '6543',
      ssl: true,
    });

    // cleanup
    delete process.env.POSTGRES_HOST;
    delete process.env.POSTGRES_USER;
    delete process.env.POSTGRES_PASSWORD;
    delete process.env.POSTGRES_DB;
    delete process.env.POSTGRES_PORT;
    delete process.env.POSTGRES_SSL;
  });

  it('environment variables override config file values', async () => {
    const mockConfig = {
      host: 'conf-host',
      user: 'conf-user',
      password: 'conf-pass',
      database: 'conf-db',
      port: '9999',
      ssl: false,
      outputDir: './out',
    };
    mockExplorer.search.mockResolvedValue({
      config: mockConfig,
      filepath: '/x',
    });
    process.env.POSTGRES_HOST = 'env-host2';
    process.env.POSTGRES_USER = 'env-user2';
    process.env.POSTGRES_PASSWORD = 'env-pass2';
    process.env.POSTGRES_DB = 'env-db2';
    process.env.POSTGRES_PORT = '7777';
    process.env.POSTGRES_SSL = 'true';

    const config = await getConfiguration();

    expect(config).toEqual({
      ...DEFAULT_CONFIGURATION,
      host: 'env-host2',
      user: 'env-user2',
      password: 'env-pass2',
      database: 'env-db2',
      port: '7777',
      ssl: true,
      outputDir: './out',
      schemaName: 'public',
    });

    delete process.env.POSTGRES_HOST;
    delete process.env.POSTGRES_USER;
    delete process.env.POSTGRES_PASSWORD;
    delete process.env.POSTGRES_DB;
    delete process.env.POSTGRES_PORT;
    delete process.env.POSTGRES_SSL;
  });

  it('environment variables override only provided fields and retain others from config', async () => {
    const mockConfig = {
      host: 'conf-host',
      user: 'conf-user',
      password: 'conf-pass',
      database: 'conf-db',
      port: '9999',
      ssl: false,
      outputDir: './out',
    };
    mockExplorer.search.mockResolvedValue({
      config: mockConfig,
      filepath: '/x',
    });

    // Only override host & password via env
    process.env.POSTGRES_HOST = 'env-host-partial';
    process.env.POSTGRES_PASSWORD = 'env-pass-partial';

    const config = await getConfiguration();

    expect(config).toEqual({
      ...DEFAULT_CONFIGURATION,
      host: 'env-host-partial',
      user: 'conf-user',
      password: 'env-pass-partial',
      database: 'conf-db',
      port: '9999',
      ssl: false,
      outputDir: './out',
      schemaName: 'public',
    });

    delete process.env.POSTGRES_HOST;
    delete process.env.POSTGRES_PASSWORD;
  });
});
