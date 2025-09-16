import type { TestProject } from 'vitest/node.js';
import type { TestDbContext } from './types.js';

import { deleteOutputFiles, getProviderOutputDir } from './cli.js';

export const setupTestContext = async (
  project: TestProject,
  setup: () => Promise<TestDbContext>
) => {
  const provider = project.name.split(':')[1];

  const label = `Done setting up ${provider} test context`;
  console.log(`Setting up ${provider} test context...`);
  console.time(label);

  await deleteOutputFiles(getProviderOutputDir(provider));

  const { teardown, config } = await setup();
  console.timeEnd(label);

  // @ts-expect-error
  project.provide('providerConfig', config);

  return async () => {
    const label = `Tearing down ${provider} test context...`;

    console.time(label);
    await teardown?.();
    console.timeEnd(label);
  };
};
