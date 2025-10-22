import { ScaffoldContext } from '../schema';
import {
  apply,
  applyTemplates,
  mergeWith,
  move,
  Rule,
  url,
} from '@angular-devkit/schematics';
import { normalize, strings } from '@angular-devkit/core';

export function createComponent(ruleContext: ScaffoldContext): Rule {
  return (_) => {
    const { resolvedName, componentPath } = ruleContext;

    return mergeWith(
      apply(url('./files'), [
        applyTemplates({
          ...ruleContext,
          name: resolvedName,
          ...strings,
        }),
        move(normalize(strings.dasherize(componentPath))),
      ]),
    );
  };
}
