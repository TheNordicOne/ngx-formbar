import {
  chain,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/workspace';
import { RuleContext, Schema } from './schema';
import { addDependencies } from './rules/add-dependencies.rule';

import { createHelperFiles } from './rules/create-helper-files.rule';
import { updateAppConfig } from './rules/update-app-config.rule';
import { updateSchematicsConfig } from './rules/update-schematics-config.rule';

import { installDependencies } from './rules/install-dependencies.rule';
import {
  DEFAULT_HELPER_PATH,
  DEFAULT_PROVIDER_CONFIG_FILE_NAME,
  DEFAULT_PROVIDER_CONFIG_PATH,
  DEFAULT_REGISTRATIONS_PATH,
  DEFAULT_SCHEMATIC_CONFIG_FILE_NAME,
  DEFAULT_SCHEMATICS_CONFIG_PATH,
} from './constants';
import { createFormworkRegistrationsConfig } from './rules/create-formwork-registration-config.rule';
import { createTokenRegistrationFiles } from './rules/create-token-registration-files.rule';
import { createConfigRegistrationFiles } from './rules/create-config-registration-files.rule';

export function ngAdd(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const workspace = await getWorkspace(tree);
    const projectName =
      options.project ?? (workspace.extensions['defaultProject'] as string);

    if (!projectName) {
      throw new SchematicsException(
        'No project specified and no default project found.',
      );
    }

    const project = workspace.projects.get(projectName);

    if (!project) {
      throw new SchematicsException(
        `Project "${projectName}" not found in workspace.`,
      );
    }

    const projectRoot = project.root;

    context.logger.info(
      `📦 Setting up ngx-formwork in project "${projectName}"...`,
    );

    options.registrationStyle ??= 'token';
    options.registrationsPath ??= `${projectRoot}/${DEFAULT_REGISTRATIONS_PATH}`;

    options.providerConfigPath ??= DEFAULT_PROVIDER_CONFIG_PATH;
    options.providerConfigFileName ??= DEFAULT_PROVIDER_CONFIG_FILE_NAME;

    options.helperPath ??= `${projectRoot}/${DEFAULT_HELPER_PATH}`;

    options.schematicsConfigPath ??= `${projectRoot}/${DEFAULT_SCHEMATICS_CONFIG_PATH}`;
    options.schematicConfigFileName ??= DEFAULT_SCHEMATIC_CONFIG_FILE_NAME;

    const ruleContext: RuleContext = {
      ...options,
      projectRoot,
      projectName,
      useRegistrationConfig: options.registrationStyle !== 'inline',
      useTokens: options.registrationStyle !== 'token',
    };

    return chain([
      addDependencies(),
      createFormworkRegistrationsConfig(ruleContext),
      createTokenRegistrationFiles(ruleContext),
      createConfigRegistrationFiles(ruleContext),
      createHelperFiles(ruleContext),
      updateSchematicsConfig(ruleContext),
      updateAppConfig(ruleContext),
      installDependencies(),
    ]);
  };
}
