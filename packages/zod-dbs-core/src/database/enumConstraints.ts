import { parseAnyArrayConstraint } from './checks/anyArrayConstraint.js';
import { parseArrayContainsConstraint } from './checks/arrayContainsConstraint.js';
import { parseInConstraint } from './checks/inConstraint.js';
import { parseOrConstraint } from './checks/orConstraint.js';

/**
 * Returns column allowed values for enum-like constraints.
 */
export function getEnumConstraints(
  columnName: string,
  constraints: string[]
): string[] {
  let enumValues: string[] = [];

  for (const constraint of constraints) {
    // Unescape any escaped quotes for all checks
    let checkClause = constraint.replace(/\\"/g, '"');

    // col = ANY (ARRAY[...])
    let values = parseAnyArrayConstraint(checkClause);
    if (values.length > 0) {
      enumValues = enumValues.concat(values);
      continue;
    }

    // col IN (...)
    values = parseInConstraint(columnName, checkClause);
    if (values.length > 0) {
      enumValues = enumValues.concat(values);
      continue;
    }

    // col = 'a' OR col = 'b' OR ...
    values = parseOrConstraint(columnName, checkClause);
    if (values.length > 0) {
      enumValues = enumValues.concat(values);
      continue;
    }

    // col <@ ARRAY[...]
    values = parseArrayContainsConstraint(columnName, checkClause);
    if (values.length > 0) {
      enumValues = enumValues.concat(values);
      continue;
    }
  }

  return enumValues;
}
