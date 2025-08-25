import { execSync } from 'child_process';

import { getCliPath } from '../../testDbUtils.js';

const cliPath = getCliPath();

it('outputs default options', async () => {
  const output = execSync(`node ${cliPath} --provider pg --help`, {
    stdio: 'pipe',
  });

  // Check that the output contains the snowlflake-specific options
  expect(output.toString()).toMatchInlineSnapshot(`
    "Usage: zod-dbs [options]

    Generates Zod schemas from database schema.

    Options:
      --provider <name>                     Database provider to use (e.g. pg,
                                            mysql, sqlite, mssql, mongodb)
      -o,--output-dir <path>                Output directory for generated schemas
      --silent                              Suppress all console output
      --module-resolution <type>            Module resolution type for generated
                                            files (commonjs or esm)
      --clean-output                        Clean output directory before generating
                                            schemas
      --no-coerce-dates                     Disable using z.coerce.date() for date
                                            fields in read schemas
      --no-stringify-json                   Disable JSON.stringify() on json fields
                                            in write schemas
      --stringify-dates                     Convert dates to ISO strings in write
                                            schemas
      --default-empty-array                 Provide empty arrays as defaults for
                                            nullable array fields
      --object-name-casing <type>           Casing for generated object/type names
                                            (choices: "PascalCase", "camelCase",
                                            "snake_case", default: "PascalCase")
      --field-name-casing <type>            Casing for field/property names in
                                            schemas & records (choices: "camelCase",
                                            "snake_case", "PascalCase",
                                            "passthrough", default: "camelCase")
      --no-case-transform                   Disable case transformations /
                                            conversions for generated schemas
      --no-singularization                  Disable singularization of type and enum
                                            names
      --exclude <regex>                     Exclude tables matching this regex
      --include <regex>                     Include only tables matching this regex
      --schema-name <name>                  Specify schema name (default: public)
      --json-schema-import-location <path>  Path to import JSON schemas
      --zod-version <number>                Zod version to use
      --connection-string <string>          Connection string
      --password <string>                   Database password
      --user <string>                       Database user
      --database <string>                   Database name
      --host <string>                       Database host
      --ssl                                 Use SSL for database connection
      --port <number>                       Database port
      --debug                               Enable debug logging (default: false)
      -h, --help                            display help for command
    "
  `);
});

it('includes provider specific options', async () => {
  const output = execSync(`node ${cliPath} --provider snowflake --help`, {
    stdio: 'pipe',
  });

  // Check that the output contains the snowlflake-specific options
  expect(output.toString()).toMatchInlineSnapshot(`
    "Usage: zod-dbs [options]

    Generates Zod schemas from database schema.

    Options:
      --provider <name>                     Database provider to use (e.g. pg,
                                            mysql, sqlite, mssql, mongodb)
      -o,--output-dir <path>                Output directory for generated schemas
      --silent                              Suppress all console output
      --module-resolution <type>            Module resolution type for generated
                                            files (commonjs or esm)
      --clean-output                        Clean output directory before generating
                                            schemas
      --no-coerce-dates                     Disable using z.coerce.date() for date
                                            fields in read schemas
      --no-stringify-json                   Disable JSON.stringify() on json fields
                                            in write schemas
      --stringify-dates                     Convert dates to ISO strings in write
                                            schemas
      --default-empty-array                 Provide empty arrays as defaults for
                                            nullable array fields
      --object-name-casing <type>           Casing for generated object/type names
                                            (choices: "PascalCase", "camelCase",
                                            "snake_case", default: "PascalCase")
      --field-name-casing <type>            Casing for field/property names in
                                            schemas & records (choices: "camelCase",
                                            "snake_case", "PascalCase",
                                            "passthrough", default: "camelCase")
      --no-case-transform                   Disable case transformations /
                                            conversions for generated schemas
      --no-singularization                  Disable singularization of type and enum
                                            names
      --exclude <regex>                     Exclude tables matching this regex
      --include <regex>                     Include only tables matching this regex
      --schema-name <name>                  Specify schema name (default: public)
      --json-schema-import-location <path>  Path to import JSON schemas
      --zod-version <number>                Zod version to use
      --connection-string <string>          Connection string
      --password <string>                   Database password
      --user <string>                       Database user
      --database <string>                   Database name
      --host <string>                       Database host
      --ssl                                 Use SSL for database connection
      --port <number>                       Database port
      --account <value>                     Snowflake account identifier (e.g.,
                                            xy12345.eu-central-1)
      --token [value]                       JWT token for authentication
      --role [value]                        Role to assume after connecting
      --warehouse [value]                   Virtual warehouse to use for the session
      --debug                               Enable debug logging (default: false)
      -h, --help                            display help for command
    "
  `);
});

it('outputs error on invalid provider', async () => {
  try {
    execSync(`node ${cliPath} --provider apple --help`, {
      stdio: 'pipe',
    });
  } catch (err: any) {
    expect(err.status).toBe(1);
    expect(err).toMatchInlineSnapshot(`
      [Error: Command failed: node /Users/magnus2/Projects/zod-dbs/packages/zod-dbs-cli/index.js --provider apple --help
      Failed to import provider apple: Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'zod-dbs-apple' imported from /Users/magnus2/Projects/zod-dbs/packages/zod-dbs-cli/dist/provider.js
      ]
    `);
  }
});

it('outputs error on missing required argument', async () => {
  try {
    execSync(`node ${cliPath} --provider snowflake`, {
      stdio: 'pipe',
    });
  } catch (err: any) {
    expect(err.status).toBe(1);
    expect(err).toMatchInlineSnapshot(`
      [Error: Command failed: node /Users/magnus2/Projects/zod-dbs/packages/zod-dbs-cli/index.js --provider snowflake
      error: required option '--account <value>' not specified
      ]
    `);
  }
});
