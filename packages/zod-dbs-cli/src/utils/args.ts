export const getArgumentValue = (name: string): string | undefined => {
  const argv = process.argv.slice(2);

  const key = name.startsWith('--') ? name : `--${name}`;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === key) return argv[i + 1];
    if (arg.startsWith(`${key}=`)) return arg.slice(key.length + 1);
  }
  return undefined;
};
