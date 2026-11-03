import {
  apply,
  applyTemplates,
  mergeWith,
  move,
  Rule,
  url,
} from '@angular-devkit/schematics';
import { RuleContext } from '../schema';
import { skipExistingFiles } from './skip-existing-files.rule';

/**
 * Optionally create helper files at specified helperPath
 */
export function createHelperFiles(ruleContext: RuleContext): Rule {
  return (tree, context) => {
    const { useHelper, helperDirectory } = ruleContext;

    if (!useHelper) {
      return;
    }

    return mergeWith(
      apply(url('./ng-add/files/helper'), [
        applyTemplates({}),
        move(helperDirectory),
        skipExistingFiles(tree, context, 'helper files'),
      ]),
    );
  };
}
