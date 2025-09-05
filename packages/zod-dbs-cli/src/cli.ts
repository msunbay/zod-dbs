import { Command, Option, program } from 'commander';
import { generateZodSchemas } from 'zod-dbs';
import {
  logDebug,
  parseConnectionString,
  toError,
  ZodDbsProvider,
} from 'zod-dbs-core';

import type { ZodDbsCliConfig, ZodDbsCliOptions } from './types.js';

import { enableDebugMode, getConfiguration } from './config.js';
import { importProvider } from './provider.js';
import { getArgumentValue } from './utils/args.js';
import { logAppName, logError, logSetting } from './utils/logger.js';
import { createProgressHandler } from './utils/progress.js';
import { getAppVersion } from './utils/version.js';

export const runCli = async (cliOptions: ZodDbsCliOptions = {}) => {
  enableDebugMode();
  logDebug('Starting zod-dbs CLI with options:', cliOptions);

  let config = await getConfiguration(cliOptions);
  logDebug('Initial configuration:', config);

  const appVersion = cliOptions.appVersion ?? (await getAppVersion());
  const appName = cliOptions.appName || 'zod-dbs';

  program.name(appName);
  program.version(appVersion);
  program.description('Generates Zod schemas from database schema.');

  const provider = await loadProvider(cliOptions.overrides?.provider, config);

  logDebug('Provider default configuration:', provider.configurationDefaults);

  // Merge provider-specific default config with file config
  config = {
    ...provider.configurationDefaults,
    ...config,
  };

  if (!cliOptions.overrides?.provider) {
    program.option('-p,--provider <name>', 'Database provider to use');
  }

  // Add provider-specific dynamic options before parsing the full CLI
  addProviderOptions(program, provider);

  const outputOptions = program.optionsGroup('Output options:');

  outputOptions.option(
    '-o,--output-dir <path>',
    'Output directory for generated schemas',
    config.outputDir
  );
  outputOptions.addOption(
    new Option(
      '--module-resolution <type>',
      'Module resolution type for generated files'
    )
      .choices(['commonjs', 'esm'])
      .default(config.moduleResolution)
  );
  outputOptions.option(
    '--clean-output',
    'Clean output directory before generating schemas'
  );
  outputOptions.option(
    '--exclude <regex>',
    'Exclude tables matching this regex'
  );
  outputOptions.option(
    '--include <regex>',
    'Include only tables matching this regex'
  );
  outputOptions.option('--silent', 'Suppress all console output');
  outputOptions.option('--debug', 'Enable debug logging');
  outputOptions.option(
    '--json-schema-import-location <path>',
    'Path to import JSON schemas'
  );
  outputOptions.addOption(
    new Option('--zod-version <value>', 'Zod version to use')
      .choices(['3', '4', '4-mini'])
      .default(config.zodVersion)
  );
  outputOptions.option(
    '--no-case-transform',
    'Disable case transformations / conversions for generated schemas'
  );
  outputOptions.option(
    '--no-singularization',
    'Disable singularization of type and enum names'
  );
  outputOptions.option(
    '--no-coerce-dates',
    'Disable using z.coerce.date() for date fields in read schemas'
  );
  outputOptions.option(
    '--no-stringify-json',
    'Disable JSON.stringify() on json fields in write schemas'
  );
  outputOptions.option(
    '--stringify-dates',
    'Convert dates to ISO strings in write schemas'
  );
  outputOptions.option(
    '--default-empty-array',
    'Provide empty arrays as defaults for nullable array fields'
  );
  outputOptions.option(
    '--default-unknown',
    'Whether to use "unknown" instead of "any" for unresolved types'
  );
  outputOptions.addOption(
    new Option(
      '--object-name-casing <type>',
      'Casing for generated object/type names'
    ).choices(['PascalCase', 'camelCase', 'snake_case'])
  );
  outputOptions.addOption(
    new Option(
      '--field-name-casing <type>',
      'Casing for field/property names in schemas & records'
    ).choices(['camelCase', 'snake_case', 'PascalCase', 'passthrough'])
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
      ...options,
      ...connectionConfig,
      ...provider.configurationOverrides, // ensure overrides are always applied
    };

    logDebug('Final configuration:', cliConfig);

    if (!cliConfig.silent) {
      logAppName(`${appName} CLI v${appVersion}`);
      logSettings(cliConfig);
      console.log();
    }

    await generateZodSchemas({
      provider,
      renderer: cliConfig.renderer,
      config: {
        ...cliConfig,
        onProgress: spinner.onProgress,
      },
    });

    spinner.done();
  } catch (error) {
    console.log('Error:');

    spinner.fail();

    logError(toError(error).message);
    logDebug(error);

    process.exit(1);
  }
};

const loadProvider = async (
  override: ZodDbsProvider | string | undefined,
  config: ZodDbsCliConfig
) => {
  try {
    const providerOrName =
      override ??
      getArgumentValue('-p') ??
      getArgumentValue('--provider') ??
      config.provider;

    return await importProvider(providerOrName);
  } catch (error) {
    logError(toError(error).message);
    logDebug(error);
    process.exit(1);
  }
};

const addProviderOptions = (program: Command, provider: ZodDbsProvider) => {
  if (!provider.options) return;

  const group = program.optionsGroup(
    `${provider.displayName ?? provider.name} options:`
  );

  for (const option of provider.options) {
    const flag =
      option.type === 'boolean'
        ? `--${option.name}`
        : `--${option.name} <value>`;
    const description = option.description;

    let cliOption = new Option(flag, description);

    if (option.allowedValues) {
      cliOption = cliOption.choices(option.allowedValues);
    }

    if (option.required) {
      cliOption = cliOption.makeOptionMandatory();
    }

    if (option.type === 'number') {
      cliOption = cliOption.argParser((value) => parseInt(value, 10));
    }

    group.addOption(cliOption);
  }
};

const logSettings = (config: ZodDbsCliConfig) => {
  for (const [key, value] of Object.entries(config)) {
    if (value !== undefined) {
      logSetting(key, value);
    }
  }
};
