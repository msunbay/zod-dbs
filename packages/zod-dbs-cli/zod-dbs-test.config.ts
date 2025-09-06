import type { ZodDbsCliConfig } from './src/types.js';

const config: ZodDbsCliConfig = {
  provider: {
    name: 'test',
    getSchemaInformation: async () => {
      return { tables: [] };
    },
  },

  outputDir: './test/integration/output/customConfigFile',
  include: ['users', 'posts'],
  exclude: ['^temp_'],
  zodVersion: '4',
  stringifyDates: true,
  defaultEmptyArray: true,
};

export default config;
