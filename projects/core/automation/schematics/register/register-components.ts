import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { RegisterContext } from './schema';
import { RegisterComponentContext } from '../shared/schema';
import { registerTypeToken } from '../shared/rules/register-type-token.rule';
import { registerTypeMap } from '../shared/rules/register-type-map.rule';

export function registerComponents(
  tree: Tree,
  registerContext: RegisterContext | undefined,
  context: SchematicContext,
) {
  if (!registerContext) {
    context.logger.error(
      'Component registration failed, because no proper context was generated!',
    );
    return;
  }

  const { controlRegistrations } = registerContext;

  if (!controlRegistrations) {
    context.logger.warn(
      'No file for registrations could be found. Skipping registration.',
    );
    return tree;
  }

  return registerComponentsByComponentInfo(registerContext);
}

function registerComponentsByComponentInfo(
  registerContext: RegisterContext,
): Rule {
  const { components, registrationType, controlRegistrations } =
    registerContext;

  const registrations: Rule[] = components.map((component) => {
    const { key, componentFilePath, componentClassName } = component;

    const registerComponentContext: RegisterComponentContext = {
      controlRegistrationsPath: controlRegistrations,
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
  });

  return chain(registrations);
}
