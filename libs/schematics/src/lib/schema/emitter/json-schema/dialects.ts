import { defineEmitter, EmitContext } from '../define-emitter';
import { buildJsonSchema, DRAFT_07, DRAFT_2020_12 } from './build';

export const draft202012Emitter = defineEmitter({
  name: 'json-schema-2020-12',
  emit(model, ctx) {
    write(ctx, buildJsonSchema(model, DRAFT_2020_12, ctx.options));
  },
});

export const draft07Emitter = defineEmitter({
  name: 'json-schema-draft-07',
  emit(model, ctx) {
    write(ctx, buildJsonSchema(model, DRAFT_07, ctx.options));
  },
});

function write(ctx: EmitContext, document: object) {
  const path = ctx.paths.output ?? `${ctx.paths.projectRoot}/form.schema.json`;
  const content = `${JSON.stringify(document, null, 2)}\n`;

  if (ctx.tree.exists(path)) {
    ctx.tree.overwrite(path, content);
    return;
  }

  ctx.tree.create(path, content);
}
