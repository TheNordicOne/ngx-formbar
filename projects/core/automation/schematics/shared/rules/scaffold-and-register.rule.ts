import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core';

import { ScaffoldContext, Schema } from '../schema';
import { findConfigPath, findSchematicsConfig, readFile } from '../file';
import {
  DEFAULT_BLOCK_HOST_PROVIDER_HELPER,
  DEFAULT_CONTROL_HOST_PROVIDER_HELPER,
  DEFAULT_GROUP_HOST_PROVIDER_HELPER,
  DEFAULT_REGISTRATION_TYPE,
  DEFAULT_VIEW_PROVIDER_HELPER,
} from '../../../shared/constants';
import { NgxFormworkAutomationConfig } from '../../../shared/shared-config.type';
import { classify } from '@angular-devkit/core/src/utils/strings';
import { createComponent } from './create-component.rule';
import { registerControl } from './register-control.rule';
import { ProjectDefinition } from '@schematics/angular/utility/workspace';
import { getProject } from '../helper';
import { buildRelativePath } from '@schematics/angular/utility/find-module';

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

  const resolvedPathOption = mergedConfig.path ?? 'app';
  const includesProjectRoot = resolvedPathOption.startsWith(projectRoot);
  const resolvedRootPath = !includesProjectRoot ? projectRoot : '';

  const componentPath = `${resolvedRootPath}/${resolvedPathOption}/${resolvedName}`;
  const componentFilePath = `/${componentPath}/${strings.dasherize(componentName)}.component`;

  const viewProviderHelperPathOption =
    automationConfig?.viewProviderHelperPath ??
    mergedConfig.viewProviderHelperPath;

  const [viewProviderHelperPath, viewProviderIdentifier] =
    resolveImportPathAndIdentifier(
      tree,
      projectRoot,
      componentFilePath,
      viewProviderHelperPathOption,
      DEFAULT_VIEW_PROVIDER_HELPER,
    );

  const hasViewProviderHelper = !!viewProviderHelperPath;

  const hostDirectiveHelperPathOptions =
    controlTypeConfig?.hostDirectiveHelperPath ??
    mergedConfig.hostDirectiveHelperPath;

  const defaultHostDirective = getDefaultHostDirective(type);

  const [hostDirectiveHelperPath, hostDirectiveIdentifier] =
    resolveImportPathAndIdentifier(
      tree,
      projectRoot,
      componentFilePath,
      hostDirectiveHelperPathOptions,
      defaultHostDirective,
    );

  const hasHostDirectiveHelper = !!hostDirectiveHelperPath;

  const controlRegistrationsPath = automationConfig?.controlRegistrationsPath
    ? `/${projectRoot}/${automationConfig.controlRegistrationsPath}`
    : findConfigPath(tree, projectRoot);

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
    viewProviderIdentifier,
    hostDirectiveHelperPath,
    hostDirectiveIdentifier,
    controlRegistrationsPath,
    hasViewProviderHelper,
    hasHostDirectiveHelper,
  };

  return ruleContext;
}

function getDefaultHostDirective(type: 'control' | 'group' | 'block') {
  switch (type) {
    case 'group':
      return DEFAULT_GROUP_HOST_PROVIDER_HELPER;
    case 'block':
      return DEFAULT_BLOCK_HOST_PROVIDER_HELPER;
    case 'control':
    default:
      return DEFAULT_CONTROL_HOST_PROVIDER_HELPER;
  }
}

function resolveImportPathAndIdentifier(
  tree: Tree,
  projectRoot: string,
  componentFilePath: string,
  pathOption: string | undefined,
  defaultFileOption: string,
) {
  if (!pathOption) {
    return [];
  }
  const { directory, fileName, identifier } = extractFromPath(
    pathOption,
    defaultFileOption,
  );

  const includesProjectRoot = directory.startsWith(projectRoot);
  const resolvedDirectory = includesProjectRoot
    ? directory
    : `/${projectRoot}/${directory}`;

  const barrelExport = `${resolvedDirectory}/index.ts`;
  if (tree.exists(barrelExport)) {
    const barrelImport = buildRelativePath(
      componentFilePath,
      resolvedDirectory,
    );
    return [barrelImport, identifier];
  }
  const directImportPath = buildRelativePath(
    componentFilePath,
    `${resolvedDirectory}/${fileName}`,
  );
  return [directImportPath, identifier];
}

const EXT_REGEX = /\.ts$/i;

function extractFromPath(inputSpec: string, defaultSpec: string) {
  const inputParts = splitHash(inputSpec);
  const defaultParts = splitHash(defaultSpec);

  const inputPathParts = splitPath(inputParts.left);
  const defaultPathParts = splitPath(defaultParts.left);

  const directory = inputPathParts.directory;
  const fileName = (
    inputPathParts.fileName || defaultPathParts.fileName
  ).replace('.ts', '');
  const identifier = inputParts.exportName || defaultParts.exportName;

  return { directory, fileName, identifier };
}

function splitHash(rawSpec: string) {
  const trimmedSpec = rawSpec.trim();
  const hashIndex = trimmedSpec.indexOf('#');

  if (hashIndex < 0) {
    return { left: trimmedSpec, exportName: '' };
  }

  return {
    left: trimmedSpec.slice(0, hashIndex),
    exportName: trimmedSpec.slice(hashIndex + 1),
  };
}

function splitPath(pathPart: string) {
  const trimmedPath = pathPart.trim();
  if (!trimmedPath) {
    return { directory: '', fileName: '' };
  }

  const normalizedPath = trimmedPath.replace(/\\/g, '/').replace(/\/+/g, '/');
  const pathSegments = normalizedPath.split('/');
  const lastSegment = pathSegments[pathSegments.length - 1];

  if (!EXT_REGEX.test(lastSegment)) {
    return { directory: normalizedPath.replace(/\/$/, ''), fileName: '' };
  }

  const directory = pathSegments.slice(0, -1).join('/');
  return { directory, fileName: lastSegment };
}
