## v2.0.3

- Fixed node 24 support

## v2.0.0

### Bugfixes

- Fixed broken output for zod 4-mini when case transforms were disabled.
- Fixed errors about failing to write files when the provider returned no tables.
- Fixed issues where some CLI flags were not not respected by some providers.
- Added missing type exports.

### Output Improvements

- Cleaned up generated code comments and property descriptions.
- Automatically detects whether case transforms are needed. If not, then they are disabled to improve readability and extensibility of the generated code / schemas.
- If no tables are found, no files or directories are written.
- Performance improvements for rendering/writing from large database schemas.

### Provider Improvements

- Providers with connection string support, now use the connection string as provided, without additional parsing or modifications.
- Initial support for schemaless databases (e.g. DynamoDb).
- Better mapping of data types to zod types.
- Case insensitive matching of include/exclude patterns.
- Improved enum detection for some providers.

### CLI Improvements

- Added `--config-name` option to specify a custom config file name.
- Improved CLI help output and logging.
- Improved masking of sensitive values in logs and error messages.

### Other Improvements

- Generally more logs in debug mode.
- More unit and integration tests.
- Generated output from tests are now also linted with biome in addition to being type checked.

### BREAKING CHANGES

- Some exported types and utility functions have been removed / renamed.
- The property `ZodDbsColumn.type` has been renamed to `ZodDbsColumn.zodType` to better reflect its purpose.
- Config files needs to import the provider types to get proper typed config files. Either add `import 'zod-dbs-[provider]` in your zod-dbs.config.ts file. Or add `zod-dbs-[provider]` to the tsconfig.json `types` field.
