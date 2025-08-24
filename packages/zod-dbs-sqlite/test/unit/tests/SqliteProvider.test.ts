import { describe, expect, it } from 'vitest';

import { createClient } from '../../../src/client.js';
import { SqliteProvider } from '../../../src/SqliteProvider.js';

vi.mock('../../../src/client', () => ({
  createClient: vi.fn(),
}));

describe('SqliteProvider', () => {
  let provider: SqliteProvider;
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([]),
      end: vi.fn().mockResolvedValue(undefined),
    };

    (createClient as any).mockReturnValue(mockClient);
  });

  it('constructs', () => {
    provider = new SqliteProvider();
    expect(provider.name).toBe('sqlite');
  });

  it('calls progress hooks and client in order', async () => {
    const onProgress = vi.fn();
    provider = new SqliteProvider();

    await provider.getSchemaInformation({ database: ':memory:', onProgress });

    expect(onProgress).toHaveBeenNthCalledWith(1, 'connecting');
    expect(onProgress).toHaveBeenNthCalledWith(2, 'fetchingSchema');
    expect(mockClient.connect).toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalled();
    expect(mockClient.end).toHaveBeenCalled();
  });
});
