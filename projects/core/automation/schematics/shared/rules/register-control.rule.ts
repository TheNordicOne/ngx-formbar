import { ScaffoldContext } from '../schema';
import { Rule } from '@angular-devkit/schematics';
import { registerTypeToken } from './register-type-token.rule';
import { registerTypeMap } from './register-type-map.rule';

export function registerControl(ruleContext: ScaffoldContext): Rule {
  return (tree, context) => {
    const { skipRegistration, controlRegistrationsPath, registrationType } =
      ruleContext;

    if (skipRegistration) {
      return tree;
    }

    if (!controlRegistrationsPath) {
      context.logger.warn(
        'No file for registrations could be found. Skipping registration.',
      );
      return tree;
    }

    switch (registrationType) {
      case 'token':
        return registerTypeToken(ruleContext);
      case 'map':
        return registerTypeMap(ruleContext);
    }
  };
}
