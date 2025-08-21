export const isArrayType = (dataType: string): boolean => {
  // Check if the udtName starts with an underscore, indicating an array type
  return dataType.startsWith('_');
};

export const isSerialType = (
  dataType: string,
  defaultValue?: string | null
): boolean => {
  // Serial types in Postgres often have default values like nextval('sequence_name'::regclass)
  return (
    defaultValue?.toLowerCase().startsWith('nextval(') ||
    dataType === 'serial' ||
    dataType === 'serial4' ||
    dataType === 'serial8' ||
    dataType === 'bigserial'
  );
};
