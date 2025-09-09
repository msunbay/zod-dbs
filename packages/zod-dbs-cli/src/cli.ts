import { Option, program } from 'commander';
import { generateZodSchemas } from 'zod-dbs';
import { logDebug, toError } from 'zod-dbs-core';

import type { Command } from 'commander';
import type { ZodDbsConfig, ZodDbsProvider } from 'zod-dbs-core';
import type { ZodDbsCliConfig, ZodDbsCliOptions } from './types.js';

import { enableDebugMode, getConfiguration } from './config.js';
import { importProvider } from './provider.js';
import { getArgumentValue, isSilentMode } from './utils/args.js';
import { logAppName, logError, logSetting } from './utils/logger.js';
import { createProgressHandler } from './utils/progress.js';
import { getAppVersion } from './utils/version.js';

export const runCli = async (cliOptions: ZodDbsCliOptions = {}) => {
  enableDebugMode();
  logDebug('Starting zod-dbs CLI with options:', cliOptions);

  const appVersion = cliOptions.appVersion ?? (await getAppVersion());
  const appName = cliOptions.appName || 'zod-dbs';
  const silent = isSilentMode();

  if (!silent) {
    logAppName(`${appName} CLI v${appVersion}`);
  }

  const config = await getConfiguration(cliOptions);

  program.name(appName);
  program.version(appVersion);
  program.description('Generates Zod schemas from database schema.');

  const provider = await loadProvider(cliOptions.overrides?.provider, config);

  if (!cliOptions.overrides?.provider) {
    program.option('-p,--provider <name>', 'Database provider to use');
  }

  program.option(
    '--config-name <name>',
    'Name of configuration file. E.g. "development" will load "zod-dbs-development.ts"'
  );

  // Add provider-specific dynamic options before parsing the full CLI
  addProviderOptions(program, provider);

  const outputOptions = program.optionsGroup('Output options:');

  outputOptions.option(
    '-o,--output-dir <path>',
    'Output directory for generated schemas'
  );
  outputOptions.addOption(
    new Option(
      '--module-resolution <type>',
      'Module resolution type for generated files. (defaults to commonjs)'
    ).choices(['commonjs', 'esm'])
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
    new Option(
      '--zod-version <value>',
      'Zod version to use. (defaults to 3)'
    ).choices(['3', '4', '4-mini'])
  );
  outputOptions.addOption(
    new Option(
      '--no-case-transform',
      'Disable case transformations / conversions for generated schemas.'
    )
  );
  outputOptions.addOption(
    new Option(
      '--no-singularization',
      'Disable singularization of type and enum names.'
    )
  );
  outputOptions.addOption(
    new Option(
      '--no-coerce-dates',
      'Disable using z.coerce.date() for date fields in read schemas.'
    )
  );
  outputOptions.addOption(
    new Option(
      '--no-stringify-json',
      'Disable using JSON.stringify() on json fields in write schemas.'
    )
  );
  outputOptions.addOption(
    new Option(
      '--no-nulls-to-undefined',
      'Disable transforming null values to undefined in generated read schemas.'
    )
  );
  outputOptions.addOption(
    new Option(
      '--stringify-dates',
      'Whether to convert dates to ISO strings in write schemas. (defaults to false)'
    )
  );
  outputOptions.addOption(
    new Option(
      '--default-empty-array',
      'Whether to use empty arrays as defaults for nullable array fields. (defaults to false)'
    )
  );
  outputOptions.addOption(
    new Option(
      '--default-unknown',
      'Whether to use "unknown" instead of "any" for unresolved types. (defaults to false)'
    )
  );
  outputOptions.addOption(
    new Option(
      '--object-name-casing <type>',
      'Casing for generated object/type names. (defaults to PascalCase)'
    ).choices(['PascalCase', 'camelCase', 'snake_case'])
  );
  outputOptions.addOption(
    new Option(
      '--field-name-casing <type>',
      'Casing for field/property names in schemas & records. (defaults to camelCase)'
    ).choices(['camelCase', 'snake_case', 'PascalCase', 'passthrough'])
  );

  program.parse();
  const options = program.opts();
  const spinner = createProgressHandler(options.silent);

  const cleanedOptions = treatNegatedOptions(options);

  try {
    const cliConfig: ZodDbsCliConfig = {
      ...config,
      ...cleanedOptions,
    };

    logDebug('Final configuration:', cliConfig);

    if (!cliConfig.silent) {
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
    if (value !== undefined && value !== null) {
      logSetting(key, value);
    }
  }
};

/**
 * Remove options that are set to true because they are using negated flags
 * (e.g. --no-case-transform sets caseTransform to false, so we want to remove
 * caseTransform if it's true to avoid overriding config files)
 */
const treatNegatedOptions = (options: ZodDbsConfig) => {
  const cleaned = { ...options };

  if (options.caseTransform) delete cleaned.caseTransform;
  if (options.singularization) delete cleaned.singularization;
  if (options.coerceDates) delete cleaned.coerceDates;
  if (options.stringifyJson) delete cleaned.stringifyJson;
  if (options.nullsToUndefined) delete cleaned.nullsToUndefined;

  return cleaned;
};
