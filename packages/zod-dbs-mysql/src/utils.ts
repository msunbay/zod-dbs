/**
 * Parses the ENUM values from a MySQL column type string.
 * Input: "enum('admin','editor','viewer')"
 */
export const parseEnumValues = (columnType: string): string[] => {
  const match = columnType?.match(/enum\(([^)]+)\)/);
  if (!match) return [];

  // Split by comma and remove quotes
  return match[1].split(',').map((value) => value.trim().replace(/^'|'$/g, ''));
};
