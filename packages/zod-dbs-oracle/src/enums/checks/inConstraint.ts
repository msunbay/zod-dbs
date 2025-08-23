/**
 * Parses an IN constraint clause to extract the allowed values for a given column.
 * e.g. "roles IN ('admin','editor','viewer')"
 */
export function parseInConstraint(
  columnName: string,
  clause: string
): string[] {
  let normalizedClause = clause.trim();
  if (!clause.startsWith('(')) normalizedClause = `(${normalizedClause})`;

  const match = normalizedClause.match(
    /\(\s*"?([a-zA-Z0-9_]+)"?\s+IN\s+\((.*?)\)\s*\)/
  );

  if (match) {
    if (match[1].toLowerCase() === columnName.toLowerCase())
      return match[2].split(',').map((v) =>
        v
          .trim()
          .replace(/'::text/g, '')
          .replace(/'/g, '')
      );
  }
  return [];
}
