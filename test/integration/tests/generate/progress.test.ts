import fs from 'fs';
import path from 'path';

import type { ZodDbsProgress } from '../../../../src/types.js';

import { generateZodSchemas } from '../../../../src/generateZodSchemas.js';
import {
  getClientConnectionString,
  getOutputDir,
  getOutputFiles,
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../../testDbUtils.js';

let ctx: TestDbContext;
let connectionString: string;

beforeAll(async () => {
  ctx = await setupTestDb();
  connectionString = getClientConnectionString();
});

afterAll(async () => {
  await teardownTestDb(ctx);
});

describe('progress callback', () => {
  it('calls onProgress callback with correct status updates', async () => {
    const progressEvents: { status: ZodDbsProgress; args?: unknown }[] = [];
    const outputDir = getOutputDir('generate', 'progress', 'progress-tracking');

    await generateZodSchemas({
      connectionString,
      moduleResolution: 'esm',
      outputDir,
      include: ['users', 'posts'],
      onProgress: (status: ZodDbsProgress, args?: unknown) => {
        progressEvents.push({ status, args });
      },
    });

    // Verify the expected progress sequence
    expect(progressEvents).toHaveLength(4);

    expect(progressEvents[0]).toEqual({
      status: 'connecting',
      args: undefined,
    });
    expect(progressEvents[1]).toEqual({
      status: 'fetchingSchema',
      args: undefined,
    });
    expect(progressEvents[2]).toEqual({
      status: 'generating',
      args: { total: 2 },
    });
    expect(progressEvents[3]).toEqual({ status: 'done', args: undefined });

    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  it('works without onProgress callback', async () => {
    const outputDir = getOutputDir('generate', 'progress', 'no-progress');

    // Should not throw when no progress callback is provided
    await expect(
      generateZodSchemas({
        connectionString,
        moduleResolution: 'esm',
        outputDir,
        include: ['users'],
        // No onProgress callback
      })
    ).resolves.toBeDefined();

    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });
});
