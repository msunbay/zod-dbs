import type { ZodDbsRenderZodTypeParams } from './ZodBaseRenderer.js';

import { ZodBaseRenderer } from './ZodBaseRenderer.js';

export class Zod4Renderer extends ZodBaseRenderer {
  public name = 'Zod4Renderer';

  protected override renderZodType(params: ZodDbsRenderZodTypeParams): string {
    let renderedType = super.renderZodType(params);

    if (params.zodType === 'json') {
      renderedType = 'z.json()';
    }

    // For read fields, we don't apply additional validation or transformations.
    if (params.isReadField) return renderedType;

    switch (params.zodType) {
      case 'email':
        return 'z.email()';
      case 'url':
        return 'z.url()';
      case 'int':
        return 'z.int()';
      case 'uuid':
        return 'z.uuid()';
      default:
        return renderedType;
    }
  }
}
