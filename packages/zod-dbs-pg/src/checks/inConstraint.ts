// src/database/checks/inConstraint.ts
export function parseInConstraint(
  columnName: string,
  clause: string
): string[] {
  const match = clause.match(/\(\s*"?([a-zA-Z0-9_]+)"?\s+IN\s+\((.*?)\)\s*\)/);
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
