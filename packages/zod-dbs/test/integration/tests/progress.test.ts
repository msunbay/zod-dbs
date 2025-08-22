import { generateZodSchemas } from '../../../src/generateZodSchemas.js';
import { createTestProvider, getOutputDir } from '../testDbUtils.js';

const provider = createTestProvider();

describe('progress callback', () => {
  it('works without onProgress callback', async () => {
    const outputDir = getOutputDir('progress', 'no-progress');

    // Should not throw when no progress callback is provided
    await expect(
      generateZodSchemas({
        provider,
        config: {
          moduleResolution: 'esm',
          outputDir,
          include: ['users'],
          // No onProgress callback
        },
      })
    ).resolves.toBeDefined();
  });
});
