import fs from 'fs';
import path from 'path';

import { generateZodSchemas } from '../../../src/generateZodSchemas.js';
import {
  createTestProvider,
  getOutputDir,
  getOutputFiles,
} from '../testDbUtils.js';

const provider = createTestProvider();

describe('schema name option', () => {
  it('generates schemas without schema name ', async () => {
    const outputDir = getOutputDir('schemaName', 'default-schema');

    await generateZodSchemas({
      provider,
      config: {
        moduleResolution: 'esm',
        outputDir,
        include: ['users'],
        // schemaName not specified, should default to provider default ('public')
      },
    });

    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  it('generates schemas for explicitly specified public schema', async () => {
    const outputDir = getOutputDir('schemaName', 'explicit-public');

    await generateZodSchemas({
      provider,
      config: {
        moduleResolution: 'esm',
        outputDir,
        schemaName: 'test',
        include: ['users'],
      },
    });

    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  // Note: Testing custom schemas would require creating them in the test database
  // For now, we'll just test the public schema variations
});
