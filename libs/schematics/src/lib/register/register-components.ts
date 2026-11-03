import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { RegisterContext } from './schema';
import { registrationsNotFoundMessage } from '@ngx-formbar/setup';
import { RegisterComponentContext } from '../shared/schema';
import { registerTypeToken } from '../shared/rules/register-type-token.rule';
import { registerTypeConfig } from '../shared/rules/register-type-map.rule';

export function registerComponents(
  tree: Tree,
  registerContext: RegisterContext,
  context: SchematicContext,
): Rule | Tree {
  const { controlRegistrations, configuredRegistrations } = registerContext;

  if (!controlRegistrations) {
    context.logger.warn(
      configuredRegistrations
        ? registrationsNotFoundMessage(configuredRegistrations)
        : 'No file for registrations could be found. Skipping registration.',
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
      case 'config':
        return registerTypeConfig(registerComponentContext);
    }
  });

  return chain(registrations);
}
