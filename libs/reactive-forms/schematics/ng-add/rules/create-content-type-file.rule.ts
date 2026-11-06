import {
  apply,
  applyTemplates,
  mergeWith,
  move,
  Rule,
  url,
} from '@angular-devkit/schematics';
import { joinToSourceRoot } from '@ngx-formbar/setup';
import { posix } from 'node:path';
import { RuleContext } from '../schema';
import {
  keptConfigUnion,
  schematicsConfigFile,
  seededUnionType,
} from '../schematics-config-file';
import { skipExistingFiles } from './skip-existing-files.rule';
import {
  DEFAULT_CONTENT_TYPE_FILE_NAME,
  DEFAULT_CONTENT_TYPE_PATH,
} from '../../shared/constants';

/**
 * Seeds an empty content union so the `control`/`group`/`block`/`array`
 * scaffolds have somewhere to add each generated config interface, and the
 * `schema` schematic has somewhere to read the union from, out of the box.
 * Only the schematics configuration file references it (via `schema.type`), so it is
 * seeded only alongside a new file or a kept file already pointing at it.
 */
export function createContentTypeFile(ruleContext: RuleContext): Rule {
  return (tree, context) => {
    const { sourceRoot, useSchematicConfig } = ruleContext;

    if (!useSchematicConfig) {
      return;
    }

    const directory = joinToSourceRoot(DEFAULT_CONTENT_TYPE_PATH, sourceRoot);
    const kept = keptConfigUnion(
      tree,
      ruleContext,
      posix.join(directory, `${DEFAULT_CONTENT_TYPE_FILE_NAME}.ts`),
    );

    if (kept === 'unset') {
      context.logger.warn(
        `${schematicsConfigFile(tree, ruleContext)} stays as it is, without this setting of this run: schema.type: ${seededUnionType(sourceRoot)}. No content union file is created for it.`,
      );
    }

    if (kept === 'unset' || kept === 'other') {
      return;
    }

    return mergeWith(
      apply(url('./ng-add/files/content-type'), [
        applyTemplates({ contentTypeFileName: DEFAULT_CONTENT_TYPE_FILE_NAME }),
        move(directory),
        skipExistingFiles(tree, context, 'content union file'),
      ]),
    );
  };
}
