import type { ZodDbsConfig } from 'zod-dbs-core';
import type {
  ZodDbsColumnBaseRenderModel,
  ZodDbsTableRenderModel,
} from './types.js';

import { Zod4Renderer } from './Zod4Renderer.js';

export class Zod4MiniRenderer extends Zod4Renderer {
  protected override getSchemaTemplateName(
    model: ZodDbsTableRenderModel,
    config: ZodDbsConfig
  ): string {
    const template = super.getSchemaTemplateName(model, config);
    if (template === 'schema.simple') return 'schema.4mini.simple';
    return 'schema.4mini';
  }

  protected override renderReadField(
    column: ZodDbsColumnBaseRenderModel,
    config: ZodDbsConfig
  ): string {
    let zodType = this.renderZodType({
      zodType: column.type,
      config,
      isReadField: true,
    });

    if (column.isEnum) {
      zodType = `z.enum(${column.enumConstantName})`;
    }

    if (column.isArray) {
      zodType = `z.array(${zodType})`;
    }

    if (
      column.type === 'json' &&
      config.jsonSchemaImportLocation &&
      column.jsonSchemaName
    ) {
      zodType = column.jsonSchemaName;
    }

    if (column.isNullable) {
      zodType = `z.nullable(${zodType})`;
    }

    if (column.isReadOptional) {
      zodType = `z.optional(${zodType})`;
    }

    if (column.isNullable || column.isReadOptional) {
      if (column.isArray && config.defaultEmptyArray)
        zodType = `z.pipe(${zodType}, z.transform(val => val ?? []))`;
      else if (config.defaultNullsToUndefined)
        zodType = `z.pipe(${zodType}, z.transform(val => val ?? undefined))`;
    }

    return zodType;
  }

  protected override renderWriteField(
    column: ZodDbsColumnBaseRenderModel,
    config: ZodDbsConfig
  ): string {
    let zodType = this.renderZodType({
      zodType: column.type,
      config,
      isReadField: false,
    });

    const baseType = this.getBaseType(column.type);

    if (baseType === 'string' && !column.isEnum) {
      if (column.writeTransforms?.includes('trim')) {
        zodType = `${zodType}.check(z.trim())`;
      }

      if (column.writeTransforms?.includes('lowercase')) {
        zodType = `${zodType}.check(z.lowercase())`;
      }

      if (column.writeTransforms?.includes('uppercase')) {
        zodType = `${zodType}.check(z.uppercase())`;
      }

      if (column.writeTransforms?.includes('normalize')) {
        zodType = `${zodType}.check(z.normalize())`;
      }
    }

    if (baseType === 'number' && !column.isEnum) {
      if (column.writeTransforms?.includes('nonnegative')) {
        zodType = `${zodType}.check(z.nonnegative())`;
      }
    }

    if (column.isEnum) {
      zodType = `z.enum(${column.enumConstantName})`;
    }

    if (column.isArray) {
      zodType = `z.array(${zodType})`;
    }

    if (
      column.type === 'json' &&
      config.jsonSchemaImportLocation &&
      column.jsonSchemaName
    ) {
      zodType = column.jsonSchemaName;
    }

    if (
      column.minLen !== undefined &&
      column.minLen !== null &&
      !column.isEnum
    ) {
      if (baseType === 'string')
        zodType = `${zodType}.check(z.minLength(${column.minLen}))`;
      else if (baseType === 'number')
        zodType = `${zodType}.check(z.minimum(${column.minLen}))`;
    }

    if (
      column.maxLen !== undefined &&
      column.maxLen !== null &&
      !column.isEnum
    ) {
      if (baseType === 'string')
        zodType = `${zodType}.check(z.maxLength(${column.maxLen}))`;
      else if (baseType === 'number')
        zodType = `${zodType}.check(z.maximum(${column.maxLen}))`;
    }

    if (column.isNullable) {
      zodType = `z.nullable(${zodType})`;
    }

    if (column.isWriteOptional) {
      zodType = `z.optional(${zodType})`;
    }

    if (column.type === 'json' && config.stringifyJson) {
      if (!column.isNullable)
        zodType = `z.pipe(${zodType}, z.transform((value) => JSON.stringify(value)))`;
      else
        zodType = `z.pipe(${zodType}, z.transform((value) => value ? JSON.stringify(value) : value))`;
    }

    if (column.type === 'date' && config.stringifyDates) {
      if (column.isArray) {
        if (!column.isNullable)
          zodType = `z.pipe(${zodType}, z.transform((value) => value.map(date => date.toISOString())))`;
        else
          zodType = `z.pipe(${zodType}, z.transform((value) => value ? value.map(date => date.toISOString()) : value))`;
      } else {
        if (!column.isNullable)
          zodType = `z.pipe(${zodType}, z.transform((value) => value.toISOString()))`;
        else
          zodType = `z.pipe(${zodType}, z.transform((value) => value ? value.toISOString() : value))`;
      }
    }

    return zodType;
  }
}
