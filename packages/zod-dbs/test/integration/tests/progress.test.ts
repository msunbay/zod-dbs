import { generateZodSchemas } from '../../../src/generateZodSchemas.js';
import { createTestConnector, getOutputDir } from '../testDbUtils.js';

const connector = createTestConnector();

describe('progress callback', () => {
  it('works without onProgress callback', async () => {
    const outputDir = getOutputDir('progress', 'no-progress');

    // Should not throw when no progress callback is provided
    await expect(
      generateZodSchemas(connector, {
        moduleResolution: 'esm',
        outputDir,
        include: ['users'],
        // No onProgress callback
      })
    ).resolves.toBeDefined();
  });
});
