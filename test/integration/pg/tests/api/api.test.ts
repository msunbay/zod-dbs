import fs from 'node:fs';
import path from 'node:path';
import { generateZodSchemas } from 'zod-dbs';
import { createProvider } from 'zod-dbs-pg';

import { getOutputFiles } from '../../../utils/cli.js';
import { getProviderConfig } from '../../../utils/context.js';
import { getOutputDir } from '../../setup.js';

it('Api generates correct zod schemas with basic options', async () => {
  const config = getProviderConfig();
  const outputDir = getOutputDir('api', 'basic');
  const provider = createProvider();

  const result = await generateZodSchemas({
    provider,
    config: {
      outputDir,
      ...config,
    },
  });

  expect(result).toMatchSnapshot();

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});

it('Api generates correct zod schemas with hooks', async () => {
  const config = getProviderConfig();
  const outputDir = getOutputDir('api', 'hooks');
  const provider = createProvider();

  await generateZodSchemas({
    provider,
    config: {
      outputDir,
      ...config,

      include: ['users'],
      zodVersion: '4',

      onColumnModelCreated(column) {
        // Add custom validation to email columns
        if (column.name === 'email') {
          return {
            ...column,
            zodType: 'email',
            writeTransforms: ['trim', 'lowercase'],
          };
        }

        // Mark column as deprecated
        if (column.name === 'name') {
          return {
            ...column,
            isDeprecated: true,
            isDeprecatedReason: 'Use first_name and last_name instead',
          };
        }

        return column;
      },

      onTableModelCreated(table) {
        table.columns = table.columns.filter(
          (column) => column.name !== 'dates'
        );

        return table;
      },
    },
  });

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
