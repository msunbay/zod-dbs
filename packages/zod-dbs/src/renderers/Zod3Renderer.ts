import type { ZodDbsRenderZodTypeParams } from './ZodBaseRenderer.js';

import { ZodBaseRenderer } from './ZodBaseRenderer.js';

export class Zod3Renderer extends ZodBaseRenderer {
  protected override renderZodType(params: ZodDbsRenderZodTypeParams): string {
    const renderedType = super.renderZodType(params);

    // For read fields, we don't apply additional validation or transformations.
    if (params.isReadField) return renderedType;

    switch (params.zodType) {
      case 'email':
        return 'z.string().email()';
      case 'url':
        return 'z.string().url()';
      case 'int':
        return 'z.number().int()';
      case 'uuid':
        return 'z.string().uuid()';
      default:
        return renderedType;
    }
  }
}
