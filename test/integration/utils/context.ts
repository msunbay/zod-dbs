import { inject } from 'vitest';
import { createConnectionString } from 'zod-dbs-core';

import type { ZodDbsProviderConfig } from 'zod-dbs-core';

export const getProviderConnectionString = (scheme: string): string => {
  //@ts-expect-error
  const config: ZodDbsProviderConfig = inject('providerConfig');

  if (!config) {
    throw new Error('Provider config not found in test context');
  }

  return createConnectionString({ ...config, scheme });
};

export const getProviderConfig = (): ZodDbsProviderConfig => {
  //@ts-expect-error
  const config = inject('providerConfig');

  if (!config) {
    throw new Error('Provider config not found in test context');
  }

  return config;
};
