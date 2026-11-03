import {
  apply,
  applyTemplates,
  mergeWith,
  move,
  Rule,
  url,
} from '@angular-devkit/schematics';
import { normalize } from '@angular-devkit/core';
import { RuleContext } from '../schema';
import {
  DEFAULT_CONTENT_TYPE_FILE_NAME,
  DEFAULT_CONTENT_TYPE_PATH,
} from '../../shared/constants';

/**
 * Seeds an empty content union so the `control`/`group`/`block`/`array`
 * scaffolds have somewhere to add each generated config interface, and the
 * `schema` schematic has somewhere to read the union from, out of the box. Only
 * the schematics config references it, so it is seeded only with that config,
 * and scaffolds edit it, so an existing file stays as it is.
 */
export function createContentTypeFile(ruleContext: RuleContext): Rule {
  return (tree, context) => {
    const { projectRoot, useSchematicConfig, schematicsConfigPath } =
      ruleContext;
    const directory = normalize(`${projectRoot}/${DEFAULT_CONTENT_TYPE_PATH}`);

    if (
      !useSchematicConfig ||
      !schematicsConfigPath ||
      tree.exists(`${directory}/${DEFAULT_CONTENT_TYPE_FILE_NAME}.ts`)
    ) {
      return;
    }

    context.logger.info('Creating content union file');

    return mergeWith(
      apply(url('./ng-add/files/content-type'), [
        applyTemplates({ contentTypeFileName: DEFAULT_CONTENT_TYPE_FILE_NAME }),
        move(directory),
      ]),
    );
  };
}
