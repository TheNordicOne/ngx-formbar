import { RegisterComponentContext, ScaffoldContext } from '../schema';
import { Rule } from '@angular-devkit/schematics';
import { registerTypeToken } from './register-type-token.rule';
import { registerTypeMap } from './register-type-map.rule';

export function registerControl(ruleContext: ScaffoldContext): Rule {
  return (tree, context) => {
    const {
      skipRegistration,
      controlRegistrationsPath,
      registrationType,
      key,
      componentFilePath,
      componentClassName,
    } = ruleContext;

    if (skipRegistration) {
      return tree;
    }

    if (!controlRegistrationsPath) {
      context.logger.warn(
        'No file for registrations could be found. Skipping registration.',
      );
      return tree;
    }

    const registerComponentContext: RegisterComponentContext = {
      controlRegistrationsPath,
      key,
      componentFilePath,
      componentClassName,
    };

    switch (registrationType) {
      case 'token':
        return registerTypeToken(registerComponentContext);
      case 'map':
        return registerTypeMap(registerComponentContext);
    }
  };
}
