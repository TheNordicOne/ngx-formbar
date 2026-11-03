import {
  apply,
  applyTemplates,
  mergeWith,
  move,
  Rule,
  url,
} from '@angular-devkit/schematics';
import { joinToSourceRoot } from '@ngx-formbar/setup';
import { RuleContext } from '../schema';
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
 * seeded only alongside that file.
 */
export function createContentTypeFile(ruleContext: RuleContext): Rule {
  return (tree, context) => {
    const { sourceRoot, useSchematicConfig } = ruleContext;

    if (!useSchematicConfig) {
      return;
    }

    return mergeWith(
      apply(url('./ng-add/files/content-type'), [
        applyTemplates({ contentTypeFileName: DEFAULT_CONTENT_TYPE_FILE_NAME }),
        move(joinToSourceRoot(DEFAULT_CONTENT_TYPE_PATH, sourceRoot)),
        skipExistingFiles(tree, context, 'content union file'),
      ]),
    );
  };
}
