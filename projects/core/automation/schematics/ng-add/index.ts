import {
  chain,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/workspace';
import { RuleContext, Schema } from './schema';

import { createHelperFiles } from './rules/create-helper-files.rule';
import { updateAppConfig } from './rules/update-app-config.rule';
import { updateSchematicsConfig } from './rules/update-schematics-config.rule';

import { installDependencies } from './rules/install-dependencies.rule';
import {
  DEFAULT_HELPER_PATH,
  DEFAULT_PROVIDER_CONFIG_FILE_NAME,
  DEFAULT_PROVIDER_CONFIG_PATH,
  DEFAULT_REGISTRATION_TYPE,
  DEFAULT_REGISTRATIONS_PATH,
  DEFAULT_SCHEMATIC_CONFIG_FILE_NAME,
  DEFAULT_SCHEMATICS_CONFIG_PATH,
} from '../../shared/constants';
import { createTokenRegistrationFiles } from './rules/create-token-registration-files.rule';
import { createConfigRegistrationFiles } from './rules/create-config-registration-files.rule';
import { createSchematicsConfig } from './rules/create-schematics-config.rule';
import { createFormbarRegistrationsConfig } from './rules/create-formwork-registration-config.rule';

// noinspection JSUnusedGlobalSymbols
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

    const projectRoot = project.sourceRoot ?? project.root;

    context.logger.info(
      `📦 Setting up ngx-formbar in project "${projectName}"...`,
    );

    options.registrationStyle ??= DEFAULT_REGISTRATION_TYPE;
    options.registrationsPath ??= DEFAULT_REGISTRATIONS_PATH;

    options.providerConfigPath ??= DEFAULT_PROVIDER_CONFIG_PATH;
    options.providerConfigFileName ??= DEFAULT_PROVIDER_CONFIG_FILE_NAME;
    if (options.providerConfigFileName.endsWith('.ts')) {
      options.providerConfigFileName =
        options.providerConfigFileName.split('.ts')[0];
    }

    options.helperPath ??= DEFAULT_HELPER_PATH;

    options.schematicsConfigPath ??= DEFAULT_SCHEMATICS_CONFIG_PATH;
    options.schematicConfigFileName ??= DEFAULT_SCHEMATIC_CONFIG_FILE_NAME;
    if (options.schematicConfigFileName.endsWith('json')) {
      options.schematicConfigFileName =
        options.schematicConfigFileName.split('.json')[0];
    }

    const ruleContext: RuleContext = {
      ...options,
      appConfigPath: `${projectRoot}/app/app.config.ts`,
      projectRoot,
      projectName,
      useTokens: options.registrationStyle === 'token',
    };

    return chain([
      createFormbarRegistrationsConfig(ruleContext),
      createTokenRegistrationFiles(ruleContext),
      createConfigRegistrationFiles(ruleContext),
      createHelperFiles(ruleContext),
      createSchematicsConfig(ruleContext),
      updateSchematicsConfig(ruleContext),
      updateAppConfig(ruleContext),
      installDependencies(),
    ]);
  };
}
