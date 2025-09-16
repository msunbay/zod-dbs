import type { ZodDbsFieldCasing } from 'zod-dbs-core';

import { singularize } from './singularize.js';

export function camelCase(str: string): string {
  if (!str) return '';
  // Split on common separators; if we have multiple parts, normalize each
  const parts = str
    .trim()
    .split(/[_\-\s]+/)
    .filter(Boolean);

  if (parts.length > 1) {
    const lower = parts.map((p) => p.toLowerCase());
    return (
      lower[0] +
      lower
        .slice(1)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join('')
    );
  }

  if (parts.length === 0) return '';

  // Single token: keep internal capitalization; only lowercase first character
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function upperFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function snakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[-\s]+/g, '-')
    .toLowerCase();
}

export const pascalCase = (str: string): string => upperFirst(camelCase(str));

export const singularUpperCase = (tableName: string): string => {
  return snakeCase(tableName)
    .split('_')
    .map(singularize)
    .map((part) => part.toUpperCase())
    .join('_');
};

export const singularPascalCase = (tableName: string): string => {
  return snakeCase(tableName)
    .split(/_|-|\s+/)
    .map(singularize)
    .map((part) => part.toLowerCase())
    .map((part) => upperFirst(camelCase(part)))
    .join('');
};

export const convertCaseFormat = (
  name: string,
  format: ZodDbsFieldCasing = 'passthrough'
): string => {
  switch (format) {
    case 'camelCase':
      return camelCase(name);
    case 'snake_case':
      return snakeCase(name);
    case 'PascalCase':
      return pascalCase(name);
    default:
      return name;
  }
};

export const formatSingularString = (
  name: string,
  format: ZodDbsFieldCasing = 'passthrough'
): string => {
  switch (format) {
    case 'PascalCase':
      return singularPascalCase(name);
    default:
      return name;
  }
};
