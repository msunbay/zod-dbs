export const removeUndefinedValues = <T extends Record<string, any>>(
  obj: T[]
): T[] => {
  return obj.map((item) => {
    const newItem: Record<string, any> = {};

    for (const key in item) {
      if (item[key] !== undefined) {
        newItem[key] = item[key];
      }
    }

    return newItem as T;
  });
};
