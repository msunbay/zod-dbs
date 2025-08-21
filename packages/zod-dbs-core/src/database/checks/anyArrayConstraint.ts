/**
 * Match col = ANY (ARRAY['a','b'])
 * Extracts values from constraints like ((\"orchardBrand\" = ANY (ARRAY['orchard'::text, 'awal'::text, 'sme'::text])))
 */
export const parseAnyArrayConstraint = (constraint: string): string[] => {
  // Unescape any escaped quotes
  let clause = constraint.replace(/\\"/g, '"');
  // Remove all leading/trailing parentheses (robust for nested cases)
  while (clause.startsWith('(') && clause.endsWith(')')) {
    clause = clause.slice(1, -1);
  }

  // Match col = ANY ((ARRAY['a'::type, ...])::type[])
  const arrayMatch = clause.match(
    /ANY\s*\(\s*(?:\(+)?ARRAY\[(.*?)\](?:\))*(::[a-zA-Z0-9_ \[\]]+)?\s*\)/
  );

  if (arrayMatch) {
    return arrayMatch[1].split(',').map((v) =>
      v
        .trim()
        // Remove any ::type cast (e.g., ::text, ::character varying, etc.)
        .replace(/'::[a-zA-Z0-9_ ]+/g, '')
        .replace(/'/g, '')
    );
  }

  return [];
};
