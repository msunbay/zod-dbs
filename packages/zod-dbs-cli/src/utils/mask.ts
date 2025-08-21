// Mask the password in the connection string for logging
export const maskConnectionString = (connectionString: string): string => {
  return connectionString.replace(
    /(postgres(?:ql)?:\/\/[^:]+:)[^@]+(@)/,
    '$1****$2'
  );
};
