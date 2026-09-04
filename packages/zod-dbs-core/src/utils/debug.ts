import debug from "debug";

const sensitiveKeyPattern =
  /password|secret|token|private[-_]?key|access[-_]?key|credential|auth/i;

const redactDebugValue = (
  value: unknown,
  seen = new WeakSet<object>(),
): unknown => {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return "[Circular]";

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactDebugValue(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      sensitiveKeyPattern.test(key) ? "****" : redactDebugValue(entry, seen),
    ]),
  );
};

export const enableDebug = () => {
  process.env.DEBUG = "zod-dbs:*";
  debug.enable("zod-dbs");
  logDebug("Debug mode enabled");
};

export const logDebug = (formatter: unknown, ...args: unknown[]) => {
  const logger = debug("zod-dbs");
  logger(
    redactDebugValue(formatter),
    ...args.map((arg) => redactDebugValue(arg)),
  );
};
