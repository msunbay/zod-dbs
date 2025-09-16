export function parseOrConstraint(
  columnName: string,
  clause: string
): string[] {
  const match = clause.match(
    /\(\s*((?:"?[a-zA-Z0-9_]+"?\s*=\s*'[^']+'\s*OR\s*)+"?[a-zA-Z0-9_]+"?\s*=\s*'[^']+')\s*\)/i
  );

  if (match) {
    const orParts = match[1].split(/\s+OR\s+/);
    const values: string[] = [];

    for (const part of orParts) {
      const eqMatch = part.match(/"?([a-zA-Z0-9_]+)"?\s*=\s*'([^']+)'/i);
      if (eqMatch && eqMatch[1] === columnName) {
        values.push(eqMatch[2]);
      }
    }

    return values;
  }

  return [];
}
