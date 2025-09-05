import { execSync } from 'child_process';

import { getCliPath } from '../../utils.js';

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
      -V, --version                         output the version number
      -p,--provider <name>                  Database provider to use
      -h, --help                            display help for command

    PostgreSQL options:
      --connection-string <value>           Full database connection string
                                            (overrides other connection options)
      --host <value>                        Database host
      --port <value>                        Database server port
      --user <value>                        Database user
      --password <value>                    Database password
      --database <value>                    Database name
      --schema-name <value>                 Database schema to introspect
      --ssl                                 Use SSL connection

    Output options:
      -o,--output-dir <path>                Output directory for generated schemas
                                            (default: "./zod-schemas")
      --module-resolution <type>            Module resolution type for generated
                                            files (choices: "commonjs", "esm",
                                            default: "commonjs")
      --clean-output                        Clean output directory before generating
                                            schemas
      --exclude <regex>                     Exclude tables matching this regex
      --include <regex>                     Include only tables matching this regex
      --silent                              Suppress all console output
      --debug                               Enable debug logging
      --json-schema-import-location <path>  Path to import JSON schemas
      --zod-version <value>                 Zod version to use (choices: "3", "4",
                                            "4-mini", default: "3")
      --no-case-transform                   Disable case transformations /
                                            conversions for generated schemas
      --no-singularization                  Disable singularization of type and enum
                                            names
      --no-coerce-dates                     Disable using z.coerce.date() for date
                                            fields in read schemas
      --no-stringify-json                   Disable JSON.stringify() on json fields
                                            in write schemas
      --stringify-dates                     Convert dates to ISO strings in write
                                            schemas
      --default-empty-array                 Provide empty arrays as defaults for
                                            nullable array fields
      --default-unknown                     Whether to use "unknown" instead of
                                            "any" for unresolved types
      --object-name-casing <type>           Casing for generated object/type names
                                            (choices: "PascalCase", "camelCase",
                                            "snake_case")
      --field-name-casing <type>            Casing for field/property names in
                                            schemas & records (choices: "camelCase",
                                            "snake_case", "PascalCase",
                                            "passthrough")
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
      -V, --version                         output the version number
      -p,--provider <name>                  Database provider to use
      -h, --help                            display help for command

    Snowflake options:
      --account <value>                     Snowflake account identifier (e.g.,
                                            xy12345.eu-central-1)
      --token <value>                       JWT token for authentication
      --role <value>                        Role to assume after connecting
      --warehouse <value>                   Virtual warehouse to use for the session

    Output options:
      -o,--output-dir <path>                Output directory for generated schemas
                                            (default: "./zod-schemas")
      --module-resolution <type>            Module resolution type for generated
                                            files (choices: "commonjs", "esm",
                                            default: "commonjs")
      --clean-output                        Clean output directory before generating
                                            schemas
      --exclude <regex>                     Exclude tables matching this regex
      --include <regex>                     Include only tables matching this regex
      --silent                              Suppress all console output
      --debug                               Enable debug logging
      --json-schema-import-location <path>  Path to import JSON schemas
      --zod-version <value>                 Zod version to use (choices: "3", "4",
                                            "4-mini", default: "3")
      --no-case-transform                   Disable case transformations /
                                            conversions for generated schemas
      --no-singularization                  Disable singularization of type and enum
                                            names
      --no-coerce-dates                     Disable using z.coerce.date() for date
                                            fields in read schemas
      --no-stringify-json                   Disable JSON.stringify() on json fields
                                            in write schemas
      --stringify-dates                     Convert dates to ISO strings in write
                                            schemas
      --default-empty-array                 Provide empty arrays as defaults for
                                            nullable array fields
      --default-unknown                     Whether to use "unknown" instead of
                                            "any" for unresolved types
      --object-name-casing <type>           Casing for generated object/type names
                                            (choices: "PascalCase", "camelCase",
                                            "snake_case")
      --field-name-casing <type>            Casing for field/property names in
                                            schemas & records (choices: "camelCase",
                                            "snake_case", "PascalCase",
                                            "passthrough")
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
    expect(err.message).toContain(`Failed to import provider apple`);
  }
});

it('outputs error on missing required argument', async () => {
  try {
    execSync(`node ${cliPath} --provider snowflake`, {
      stdio: 'pipe',
    });
  } catch (err: any) {
    expect(err.status).toBe(1);
    expect(err.message).toContain(
      `error: required option '--account <value>' not specified`
    );
  }
});
