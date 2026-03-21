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

/**
 * Optionally create helper files at specified helperPath
 */
export function createHelperFiles(ruleContext: RuleContext): Rule {
  return (_, context) => {
    const { useHelper, helperPath, projectRoot } = ruleContext;

    if (!useHelper || !helperPath) {
      return;
    }

    context.logger.info('Creating helper files');

    return mergeWith(
      apply(url('./files/helper'), [
        applyTemplates({}),
        move(normalize(`${projectRoot}/${helperPath}`)),
      ]),
    );
  };
}
