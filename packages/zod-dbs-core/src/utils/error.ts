export const toError = (error: unknown): Error => {
  if (
    error instanceof Error &&
    'errors' in error &&
    Array.isArray(error.errors)
  ) {
    return new Error(error.errors[0]);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
};
