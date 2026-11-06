import {
  chain,
  filter,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';

/**
 * Seeded files are starting points the consumer owns and later scaffolds edit,
 * so a re-run of ng-add leaves any file that already exists untouched.
 */
export function skipExistingFiles(
  tree: Tree,
  context: SchematicContext,
  description: string,
): Rule {
  return chain([
    filter((path) => {
      const exists = tree.exists(path);

      if (exists) {
        context.logger.info(`Keeping existing ${path}`);
      }

      return !exists;
    }),
    (files) => {
      if (hasFiles(files)) {
        context.logger.info(`Creating ${description}`);
      }
    },
  ]);
}

function hasFiles(files: Tree) {
  let found = false;

  files.visit(() => {
    found = true;
  });

  return found;
}
