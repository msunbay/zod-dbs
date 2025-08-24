import { Option, program } from 'commander';
import { generateZodSchemas } from 'zod-dbs';
import {
  enableDebug,
  logDebug,
  parseConnectionString,
  toError,
} from 'zod-dbs-core';

import type { ZodDbsCliConfig, ZodDbsCliOptions } from './types.js';

import { getConfiguration } from './config.js';
import { loadProvider } from './provider.js';
import { logAppName, logError, logSetting } from './utils/logger.js';
import { createProgressHandler } from './utils/progress.js';
import { getAppVersion } from './utils/version.js';

export const runCli = async (cliOptions: ZodDbsCliOptions = {}) => {
  const config = await getConfiguration(cliOptions);
  const appVersion = await getAppVersion();
  const appName = cliOptions.appName || 'zod-dbs';

  program.name(appName);
  program.description('Generates Zod schemas from database schema.');

  if (!cliOptions.overrides?.provider) {
    program.option(
      '--provider <name>',
      'Database provider to use (e.g. pg, mysql, sqlite, mssql, mongodb)'
    );
  }

  program.option(
    '-o,--output-dir <path>',
    'Output directory for generated schemas'
  );
  program.option('--silent', 'Suppress all console output', config.silent);
  program.option(
    '--module-resolution <type>',
    'Module resolution type for generated files (commonjs or esm)'
  );
  program.option(
    '--clean-output',
    'Clean output directory before generating schemas'
  );
  program.option(
    '--no-coerce-dates',
    'Disable using z.coerce.date() for date fields in read schemas'
  );
  program.option(
    '--no-stringify-json',
    'Disable JSON.stringify() on json fields in write schemas'
  );
  program.option(
    '--stringify-dates',
    'Convert dates to ISO strings in write schemas'
  );
  program.option(
    '--default-empty-array',
    'Provide empty arrays as defaults for nullable array fields'
  );
  program.addOption(
    new Option(
      '--object-name-casing <type>',
      'Casing for generated object/type names'
    )
      .choices(['PascalCase', 'camelCase', 'snake_case'])
      .default(config.objectNameCasing)
  );
  program.addOption(
    new Option(
      '--field-name-casing <type>',
      'Casing for field/property names in schemas & records'
    )
      .choices(['camelCase', 'snake_case', 'PascalCase', 'passthrough'])
      .default(config.fieldNameCasing)
  );
  program.option(
    '--no-case-transform',
    'Disable case transformations / conversions for generated schemas'
  );
  program.option(
    '--no-singularization',
    'Disable singularization of type and enum names'
  );
  program.option('--exclude <regex>', 'Exclude tables matching this regex');
  program.option(
    '--include <regex>',
    'Include only tables matching this regex'
  );
  program.option(
    '--schema-name <name>',
    'Specify schema name (default: public)'
  );
  program.option(
    '--json-schema-import-location <path>',
    'Path to import JSON schemas'
  );
  program.option('--connection-string <string>', 'Postgres connection string');
  program.option('--password <string>', 'Postgres password');
  program.option('--user <string>', 'Postgres user');
  program.option('--database <string>', 'Postgres database');
  program.option('--host <string>', 'Postgres host');
  program.option('--ssl', 'Use SSL for Postgres connection');
  program.option('--port <number>', 'Postgres port');
  program.option('--zod-version <number>', 'Zod version to use');
  program.option(
    '--debug',
    'Enable debug logging',
    () => {
      enableDebug();
      return true;
    },
    false
  );

  program.parse();
  const options = program.opts();
  const spinner = createProgressHandler(options.silent);

  try {
    const connectionConfig = options.connectionString
      ? parseConnectionString(options.connectionString)
      : options;

    const provider = await loadProvider(options.provider ?? config.provider);

    const cliConfig: ZodDbsCliConfig = {
      ...provider.defaultConfiguration,
      ...config,
      ...connectionConfig,
      ...options,
      onProgress: spinner.onProgress,
    };

    logDebug('CLI configuration:', cliConfig);

    if (!cliConfig.silent) {
      logAppName(`${appName} CLI v${appVersion}`);
      logSettings(cliConfig);
      console.log();
    }

    await generateZodSchemas({
      provider,
      renderer: cliConfig.renderer,
      config: cliConfig,
    });

    spinner.done();
  } catch (error) {
    spinner.fail();

    logError(toError(error).message);
    logDebug(error);

    process.exit(1);
  }
};

const logSettings = (cliConfig: ZodDbsCliConfig) => {
  if (cliConfig.provider && typeof cliConfig.provider === 'string') {
    logSetting('provider', cliConfig.provider);
  } else if (cliConfig.provider && typeof cliConfig.provider === 'object') {
    logSetting('provider', cliConfig.provider.name);
  }

  if (cliConfig.outputDir) logSetting('output', cliConfig.outputDir);
  if (cliConfig.cleanOutput) logSetting('clean-output', 'true');
  if (!cliConfig.stringifyJson) logSetting('stringify-json', 'false');
  if (cliConfig.stringifyDates) logSetting('stringify-dates', 'true');
  if (cliConfig.defaultEmptyArray) logSetting('default-empty-array', 'true');
  if (!cliConfig.coerceDates) logSetting('coerce-dates', 'false');
  if (!cliConfig.caseTransform) logSetting('case-transform', 'false');
  if (!cliConfig.singularization) logSetting('singularization', 'false');
  if (cliConfig.moduleResolution)
    logSetting('module', cliConfig.moduleResolution);
  if (cliConfig.zodVersion) logSetting('zod-version', cliConfig.zodVersion);

  if (cliConfig.host) logSetting('host', cliConfig.host);
  if (cliConfig.port) logSetting('port', cliConfig.port.toString());
  if (cliConfig.database) logSetting('database', cliConfig.database);
  if (cliConfig.user) logSetting('user', cliConfig.user);
  if (cliConfig.password) logSetting('password', '******');
  logSetting('ssl', cliConfig.ssl ? 'true' : 'false');
  if (cliConfig.schemaName) logSetting('schema-name', cliConfig.schemaName);

  if (process.env.DEBUG) logSetting('debug', process.env.DEBUG);

  if (cliConfig.include) logSetting('include', cliConfig.include.toString());
  if (cliConfig.exclude) logSetting('exclude', cliConfig.exclude.toString());

  if (cliConfig.jsonSchemaImportLocation) {
    logSetting('json-import-location', cliConfig.jsonSchemaImportLocation);
  }
};
