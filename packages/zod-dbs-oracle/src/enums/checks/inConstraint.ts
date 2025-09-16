/**
 * Parses an IN constraint clause to extract the allowed values for a given column.
 * e.g. "roles IN ('admin','editor','viewer')"
 */
export function parseInConstraint(
  columnName: string,
  clause: string
): string[] {
  // Normalize clause and strip only matching outer parentheses pairs
  let normalized = clause.trim();
  const stripOuterParens = (s: string) => {
    let str = s.trim();
    while (str.startsWith('(') && str.endsWith(')')) {
      // find matching closing paren for first char
      let depth = 0;
      let matchIndex = -1;
      for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (ch === '(') depth++;
        else if (ch === ')') {
          depth--;
          if (depth === 0) {
            matchIndex = i;
            break;
          }
        }
      }
      // only strip if the matching closing paren is the last character
      if (matchIndex === str.length - 1) {
        str = str.slice(1, -1).trim();
        continue;
      }
      break;
    }
    return str;
  };

  normalized = stripOuterParens(normalized);

  // Look for patterns like: columnName IN (...) or "COLUMN" IN (...)
  const colNameEsc = columnName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  // Match column name at start or preceded by a non-word/quote character, allow optional double quotes
  const prefix = '(?:^|[^A-Za-z0-9_"\'])';
  const pattern = prefix + '"?' + colNameEsc + '"?' + '\\s*IN\\s*\\(([^)]*)\\)';
  const re = new RegExp(pattern, 'i');
  const match = normalized.match(re);

  if (match) {
    return match[1]
      .split(',')
      .map((v) => {
        let val = v.trim();
        // remove PostgreSQL-style type casts like ::text or ::character varying
        val = val.replace(/::[^)\s]*/g, '').trim();
        // remove surrounding single or double quotes
        val = val.replace(/^'+|'+$/g, '').replace(/^"+|"+$/g, '');
        return val;
      })
      .filter(Boolean);
  }

  return [];
}
