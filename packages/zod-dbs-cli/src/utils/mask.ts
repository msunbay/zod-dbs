const maskConnectionString = (connectionString: string): string => {
  if (!connectionString) return '';

  let masked = connectionString;

  // 1) Try URL-style masking: scheme://username:password@host ...
  // Works for any scheme (postgres, mysql, mongodb+srv, mssql, snowflake, etc.)
  try {
    // Only attempt URL parsing if it looks like a URL (has a scheme:)
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(masked)) {
      // If it contains authority (//), URL will preserve userinfo
      if (masked.includes('//')) {
        const url = new URL(masked);
        if (url.password) {
          url.password = '****';
        }
        // Normalize URL (might reorder params), then continue with further masking
        masked = url.toString();
      }
    }
  } catch {
    // Ignore parse errors; fall back to regex approaches below
  }

  // 2) Generic userinfo masking without full URL parse: mask username:password@ (any scheme)
  // Replace only the password portion after the first ':' in the userinfo segment
  masked = masked.replace(
    /(\/\/)([^\/?#@]*)(@)/,
    (_m, p1: string, userinfo: string, p3: string) => {
      const idx = userinfo.indexOf(':');
      if (idx === -1) return `${p1}${userinfo}${p3}`;
      const userPart = userinfo.slice(0, idx + 1); // include colon
      return `${p1}${userPart}****${p3}`;
    }
  );

  // 3) Mask sensitive query parameters in URLs: ?password=...&token=...
  masked = masked.replace(
    /([?&])(password|pwd|token|sessiontoken|secret|clientsecret|client[_-]?secret|accesskeyid|secretaccesskey|access[_-]?key|secret[_-]?key|api[_-]?key|accountkey)=([^&#]*)/gi,
    (_m, sep: string, key: string) => `${sep}${key}=****`
  );

  // 4) Mask DSN-style key=value pairs (e.g., mssql/oracle). Apply only on DSN-like strings
  // to avoid clobbering URL query strings.
  if (
    masked.includes(';') ||
    (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(masked) && !masked.includes('?'))
  ) {
    masked = masked.replace(
      /(\b(password|pwd|token|sessiontoken|secret|clientsecret|client[_-]?secret|accesskeyid|secretaccesskey|access[_-]?key|secret[_-]?key|api[_-]?key|accountkey)\s*=\s*)('(?:[^']*)'|"(?:[^"]*)"|[^;&\s'"\)]+)/gi,
      (_m, prefix: string, _key: string, value: string) => {
        if (value?.startsWith("'") && value.endsWith("'"))
          return `${prefix}'****'`;
        if (value?.startsWith('"') && value.endsWith('"'))
          return `${prefix}"****"`;
        return `${prefix}****`;
      }
    );
  }

  return masked;
};

export const maskSensitiveValue = (
  name: string,
  value: string | undefined
): string => {
  if (!value) return '';

  const lowerName = name.toLowerCase();

  if (
    lowerName.includes('password') ||
    lowerName.includes('secret') ||
    lowerName.includes('token')
  ) {
    return '****';
  }

  if (name === 'connectionString') {
    return maskConnectionString(value);
  }

  return value;
};
