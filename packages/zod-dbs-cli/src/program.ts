import { Command, Option } from 'commander';

import type { ZodDbsConfig, ZodDbsProvider } from 'zod-dbs-core';

const addProviderOptions = (cmd: Command, provider: ZodDbsProvider) => {
  if (!provider.options) return;

  const group = cmd.optionsGroup(
    `${provider.displayName ?? provider.name} options:`
  );

  for (const option of provider.options) {
    const flag =
      option.type === 'boolean'
        ? `--${option.name}`
        : `--${option.name} <value>`;

    let cliOption = new Option(flag, option.description);

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

/**
 * Remove negated options that are set to true so they do not override config files
 */
const handleNegatedOptions = (options: ZodDbsConfig) => {
  const cleaned = { ...options };

  if (options.caseTransform) delete cleaned.caseTransform;
  if (options.singularization) delete cleaned.singularization;
  if (options.coerceDates) delete cleaned.coerceDates;
  if (options.stringifyJson) delete cleaned.stringifyJson;
  if (options.nullsToUndefined) delete cleaned.nullsToUndefined;

  return cleaned;
};

export const runCommander = ({
  provider,
  appName,
  appVersion,
  includeProviderOption,
}: {
  provider: ZodDbsProvider;
  appName: string;
  appVersion: string;
  includeProviderOption: boolean;
}): Record<string, unknown> => {
  const cmd = new Command();

  cmd.name(appName);
  cmd.version(appVersion);
  cmd.description('Generates Zod schemas from database schema.');

  if (includeProviderOption) {
    cmd.option('-p,--provider <name>', 'Database provider to use');
  }

  cmd.option(
    '--config-name <name>',
    'Name of configuration file. E.g. "development" will load "zod-dbs-development.ts"'
  );

  // Add provider-specific dynamic options before parsing the full CLI
  addProviderOptions(cmd, provider);

  const outputOptions = cmd.optionsGroup('Output options:');

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

  cmd.parse();

  return handleNegatedOptions(cmd.opts());
};
