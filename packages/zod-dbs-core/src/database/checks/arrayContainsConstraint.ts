// src/database/checks/arrayContainsConstraint.ts
export function parseArrayContainsConstraint(
  columnName: string,
  clause: string
): string[] {
  const match = clause.match(/\(\s*([a-zA-Z0-9_]+)\s*<@\s*ARRAY\[(.*?)\]\s*\)/);
  if (match && match[1] === columnName) {
    return match[2].split(',').map((v) =>
      v
        .trim()
        .replace(/'::text/g, '')
        .replace(/'/g, '')
    );
  }
  return [];
}
