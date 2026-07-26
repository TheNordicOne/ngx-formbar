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
 * `schema` schematic has somewhere to read the union from, out of the box.
 */
export function createContentTypeFile(ruleContext: RuleContext): Rule {
  return (_, context) => {
    const { projectRoot } = ruleContext;

    context.logger.info('Creating content union file');

    return mergeWith(
      apply(url('./ng-add/files/content-type'), [
        applyTemplates({ contentTypeFileName: DEFAULT_CONTENT_TYPE_FILE_NAME }),
        move(normalize(`${projectRoot}/${DEFAULT_CONTENT_TYPE_PATH}`)),
      ]),
    );
  };
}
