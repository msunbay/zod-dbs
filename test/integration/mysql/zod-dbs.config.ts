const config = {
  provider: 'mysql',

  user: 'test',
  password: 'test',
  host: 'localhost',
  database: 'test',
  port: 3306,

  outputDir: './test/integration/mysql/output/config',
  exclude: ['^temp_'],
  zodVersion: '4',
  stringifyDates: true,
  defaultEmptyArray: true,
  objectNameCasing: 'snake_case',
  fieldNameCasing: 'snake_case',
  caseTransform: false,
  singularization: false,
  moduleResolution: 'esm',
  debug: true,
};

export default config;
