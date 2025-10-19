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
  return () => {
    const { useHelper, helperPath } = ruleContext;

    if (!useHelper || !helperPath) {
      return;
    }

    return mergeWith(
      apply(url('./files/helper'), [
        applyTemplates({}),
        move(normalize(helperPath)),
      ]),
    );
  };
}
