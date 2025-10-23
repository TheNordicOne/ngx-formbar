import {
  chain,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core';

import { ScaffoldContext, Schema } from '../schema';
import { findConfigPath, findSchematicsConfig, readFile } from '../file';
import { DEFAULT_REGISTRATION_TYPE } from '../../../shared/constants';
import { NgxFormworkAutomationConfig } from '../../../shared/shared-config.type';
import { classify } from '@angular-devkit/core/src/utils/strings';
import { createComponent } from './create-component.rule';
import { registerControl } from './register-control.rule';
import {
  getWorkspace,
  ProjectDefinition,
} from '@schematics/angular/utility/workspace';

export function scaffoldAndRegister(
  options: Schema,
  type: 'control' | 'group' | 'block',
): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const project = await getProject(tree, options.project);

    const ruleContext = mergeOptions(options, type, project, tree, context);

    return chain([createComponent(ruleContext), registerControl(ruleContext)]);
  };
}

async function getProject(tree: Tree, projectName?: string) {
  const workspace = await getWorkspace(tree);
  projectName ??= workspace.extensions['defaultProject'] as string;

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

  return project;
}

function mergeOptions(
  options: Schema,
  type: 'control' | 'group' | 'block',
  project: ProjectDefinition,
  tree: Tree,
  context: SchematicContext,
) {
  const projectRoot = project.sourceRoot ?? project.root;

  const automationConfigPath = options.schematicsConfig
    ? `${projectRoot}/${options.schematicsConfig ?? ''}`
    : findSchematicsConfig(tree);

  const automationConfig = readFile<NgxFormworkAutomationConfig | null>(
    tree,
    automationConfigPath,
  );
  const controlTypeConfig = automationConfig ? automationConfig[type] : {};

  const mergedConfig: Schema = {
    ...options,
    ...controlTypeConfig,
    viewProviderHelperPath:
      automationConfig?.viewProviderHelperPath ??
      options.viewProviderHelperPath,
  };

  const resolvedName = mergedConfig.name ?? mergedConfig.key;
  const componentName = `${resolvedName}${mergedConfig.componentSuffix ?? ''}`;

  const componentPath = `${projectRoot}/${mergedConfig.path ?? 'app'}/${resolvedName}`;
  const componentFilePath = `/${componentPath}/${strings.dasherize(componentName)}.component`;

  const viewProviderHelperPath =
    automationConfig?.viewProviderHelperPath ??
    mergedConfig.viewProviderHelperPath;

  const hostDirectiveHelperPath =
    controlTypeConfig?.hostDirectiveHelperPath ??
    mergedConfig.hostDirectiveHelperPath;

  const controlRegistrationsPath =
    automationConfig?.controlRegistrationsPath ??
    findConfigPath(tree, projectRoot);

  if (!controlRegistrationsPath) {
    context.logger.warn(
      'No configuration files provided or found! Registration will be skipped!',
    );
  }

  const ruleContext: ScaffoldContext = {
    ...mergedConfig,
    registrationType:
      automationConfig?.registrationType ?? DEFAULT_REGISTRATION_TYPE,
    resolvedName,
    interfaceName: classify(
      `${mergedConfig.name ?? mergedConfig.key}${controlTypeConfig?.interfaceSuffix ?? mergedConfig.interfaceSuffix ?? ''}`,
    ),
    componentName,
    componentClassName: classify(`${componentName}Component`),
    componentPath,
    componentFilePath,
    projectRoot,
    viewProviderHelperPath,
    hostDirectiveHelperPath,
    controlRegistrationsPath,
    hasViewProviderHelper: !!viewProviderHelperPath,
    hasHostDirectiveHelper: !!hostDirectiveHelperPath,
  };

  return ruleContext;
}
