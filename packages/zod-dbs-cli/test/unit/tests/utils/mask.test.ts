import { maskSensitiveValue } from '../../../../src/utils/mask.js';

describe('maskSensitiveValue', () => {
  it('masks plain sensitive values by name', () => {
    expect(maskSensitiveValue('password', 'supersecret')).toBe('****');
    expect(maskSensitiveValue('secret', 'x')).toBe('****');
    expect(maskSensitiveValue('token', 'abc')).toBe('****');
    expect(maskSensitiveValue('sessionToken', 'abc')).toBe('****');
    expect(maskSensitiveValue('clientSecret', 'abc')).toBe('****');
  });

  it('returns empty string for undefined/empty values', () => {
    expect(
      maskSensitiveValue('password', undefined as unknown as string | undefined)
    ).toBe('');
  });

  it('masks URL userinfo password (any scheme)', () => {
    expect(
      maskSensitiveValue(
        'connectionString',
        'postgres://user:pass@localhost:5432/db?ssl=true'
      )
    ).toEqual('postgres://user:****@localhost:5432/db?ssl=true');

    expect(
      maskSensitiveValue(
        'connectionString',
        'mysql://user:secret@127.0.0.1:3306/db'
      )
    ).toEqual('mysql://user:****@127.0.0.1:3306/db');

    expect(
      maskSensitiveValue(
        'connectionString',
        'mongodb+srv://u:p%40ss@cluster.mongodb.net/db?retryWrites=true'
      )
    ).toEqual('mongodb+srv://u:****@cluster.mongodb.net/db?retryWrites=true');
  });

  it('masks sensitive query parameters', () => {
    const input =
      'postgres://u:pw@host/db?password=pw&token=abc&sessionToken=xyz&api_key=123';
    const expected =
      'postgres://u:****@host/db?password=****&token=****&sessionToken=****&api_key=****';
    const masked = maskSensitiveValue('connectionString', input);
    expect(masked).toEqual(expected);
  });

  it('masks DSN style key=value pairs (unquoted and quoted)', () => {
    const dsn1 =
      'Server=.;Database=db;User Id=sa;Password=VerySecret;Encrypt=true;';
    const dsn2 =
      "Host=localhost; User Id='user'; Password='VerySecret'; Schema=public";

    const m1 = maskSensitiveValue('connectionString', dsn1);
    const m2 = maskSensitiveValue('connectionString', dsn2);

    expect(m1).toContain('Password=****');
    expect(m2).toContain("Password='****'");
    expect(m2).not.toContain('VerySecret');

    expect(m1).toEqual(
      'Server=.;Database=db;User Id=sa;Password=****;Encrypt=true;'
    );
    expect(m2).toEqual(
      "Host=localhost; User Id='user'; Password='****'; Schema=public"
    );
  });

  it('masks AWS-style credentials in query/kv', () => {
    const q =
      'http://localhost:8000?accessKeyId=AKIA...&secretAccessKey=shhh&sessionToken=tok';
    const kv =
      'Endpoint=http://localhost:8000; AccessKeyId=AKIA...; SecretAccessKey=shhh;';

    const mq = maskSensitiveValue('connectionString', q);
    const mkv = maskSensitiveValue('connectionString', kv);

    // URL will be normalized to include trailing slash after host
    expect(mq).toEqual(
      'http://localhost:8000/?accessKeyId=****&secretAccessKey=****&sessionToken=****'
    );
    expect(mkv).toEqual(
      'Endpoint=http://localhost:8000; AccessKeyId=****; SecretAccessKey=****;'
    );
  });

  it('leaves non-sensitive connection strings unchanged beyond masking', () => {
    const conn = 'postgres://user:pw@localhost:5432/db?ssl=true';
    const masked = maskSensitiveValue('connectionString', conn);
    expect(masked).toEqual('postgres://user:****@localhost:5432/db?ssl=true');
  });
});
