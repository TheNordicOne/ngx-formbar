import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { defineEmitter, EmitOptions } from '../define-emitter';
import { buildJsonSchema, Dialect, DRAFT_07, DRAFT_2020_12 } from './build';

export const draft202012Emitter = jsonSchemaEmitter(
  'json-schema-2020-12',
  DRAFT_2020_12,
  'form.schema.json',
);

export const draft07Emitter = jsonSchemaEmitter(
  'json-schema-draft-07',
  DRAFT_07,
  'form.schema.draft-07.json',
);

function jsonSchemaEmitter(
  name: string,
  dialect: Dialect,
  defaultOutput: string,
) {
  return {
    ...defineEmitter({
      name,
      emit(model, ctx) {
        const docs = docsOption(name, ctx.options);
        const { output } = ctx.paths;

        if (!output) {
          throw new SchematicsException(
            `The "${name}" emitter received no output path.`,
          );
        }

        write(ctx.tree, output, buildJsonSchema(model, dialect, { docs }));
      },
    }),
    defaultOutput,
  };
}

function docsOption(emitter: string, options: EmitOptions) {
  const { docs = true } = options;

  if (typeof docs !== 'boolean') {
    throw new SchematicsException(
      `"options.docs" of the "${emitter}" emitter must be a boolean, got ${JSON.stringify(docs)}.`,
    );
  }

  return docs;
}

function write(tree: Tree, path: string, document: object) {
  const content = `${JSON.stringify(document, null, 2)}\n`;

  if (tree.exists(path)) {
    tree.overwrite(path, content);
    return;
  }

  tree.create(path, content);
}
