import type { TestProject } from 'vitest/node.js';

import { setupTestContext } from '../utils/setup.js';
import { setupTestDb } from './setup.js';

export default async (project: TestProject) => {
  return setupTestContext(project, setupTestDb);
};
