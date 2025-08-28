import { Command, Option, program } from 'commander';
import { generateZodSchemas } from 'zod-dbs';
import {
  enableDebug,
  logDebug,
  parseConnectionString,
  toError,
  ZodDbsProvider,
} from 'zod-dbs-core';

import type {
  ZodDbsCliConfig,
  ZodDbsCliOptions,
  ZodDbsProviderName,
} from './types.js';

import { getConfiguration } from './config.js';
import { importProvider } from './provider.js';
import { getArgumentValue } from './utils/args.js';
import { logAppName, logError, logSetting } from './utils/logger.js';
import { createProgressHandler } from './utils/progress.js';
import { getAppVersion } from './utils/version.js';

export const runCli = async (cliOptions: ZodDbsCliOptions = {}) => {
  const config = await getConfiguration(cliOptions);
  const appVersion = cliOptions.appVersion ?? (await getAppVersion());
  const appName = cliOptions.appName || 'zod-dbs';

  program.name(appName);
  program.version(appVersion);
  program.description('Generates Zod schemas from database schema.');

  const provider = await loadProvider(cliOptions.overrides?.provider, config);

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
  program.option('--zod-version <number>', 'Zod version to use');

  program.option('--connection-string <string>', 'Connection string');
  program.option('--password <string>', 'Database password');
  program.option('--user <string>', 'Database user');
  program.option('--database <string>', 'Database name');
  program.option('--host <string>', 'Database host');
  program.option('--ssl', 'Use SSL for database connection');
  program.option('--port <number>', 'Database port');

  // Add provider-specific dynamic options before parsing the full CLI
  addProviderOptions(program, provider);

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

    const cliConfig: ZodDbsCliConfig = {
      ...config,
      ...connectionConfig,
      ...options,
      onProgress: spinner.onProgress,
    };

    logDebug('CLI configuration:', cliConfig);

    if (!cliConfig.silent) {
      logAppName(`${appName} CLI v${appVersion}`);
      logSettings(provider, cliConfig);
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

const loadProvider = async (
  override: ZodDbsProvider | ZodDbsProviderName | undefined,
  config: ZodDbsCliConfig
) => {
  try {
    const providerOrName =
      override ?? getArgumentValue('--provider') ?? config.provider;

    return await importProvider(providerOrName);
  } catch (error) {
    logError(toError(error).message);
    logDebug(error);
    process.exit(1);
  }
};

const addProviderOptions = (program: Command, provider: ZodDbsProvider) => {
  if (!provider.options) return;

  for (const option of provider.options) {
    const flag = option.required
      ? `--${option.name} <value>`
      : `--${option.name} [value]`;
    const description = option.description;
    const addOption = option.required
      ? program.requiredOption.bind(program)
      : program.option.bind(program);

    if (option.allowedValues) {
      program.addOption(
        new Option(flag, description)
          .choices(option.allowedValues)
          .makeOptionMandatory(option.required)
      );
    } else if (option.type === 'boolean') {
      addOption(flag, description);
    } else if (option.type === 'number') {
      addOption(flag, description, (value) => parseInt(value, 10));
    } else {
      addOption(flag, description);
    }
  }
};

const logSettings = (provider: ZodDbsProvider, cliConfig: ZodDbsCliConfig) => {
  logSetting('provider', provider.name);

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
