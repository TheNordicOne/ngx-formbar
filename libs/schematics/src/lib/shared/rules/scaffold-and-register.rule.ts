import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core';

import { ScaffoldContext, Schema } from '../schema';
import {
  AngularComponentNaming,
  DEFAULT_REGISTRATION_TYPE,
  findConfigPath,
  findSchematicsConfig,
  getAngularComponentNaming,
  getProjectDefinition,
  NgxFormbarAutomationConfig,
  readFile,
} from '@ngx-formbar/setup';
import {
  DEFAULT_INTERFACE_FILE_SUFFIX,
  DEFAULT_VIEW_PROVIDER_HELPER,
} from '../constants';
import { createComponent } from './create-component.rule';
import { registerControl } from './register-control.rule';
import {
  getWorkspace,
  ProjectDefinition,
} from '@schematics/angular/utility/workspace';
import { buildRelativePath } from '@schematics/angular/utility/find-module';

type ScaffoldType = 'control' | 'group' | 'block' | 'array';

const { classify, dasherize } = strings;

export function scaffoldAndRegister(options: Schema, type: ScaffoldType): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const workspace = await getWorkspace(tree);
    const project = getProjectDefinition(workspace, options.project);
    const componentNaming = getAngularComponentNaming(workspace, project);

    const ruleContext = buildScaffoldContext(
      options,
      type,
      project,
      componentNaming,
      tree,
      context,
    );

    return chain([createComponent(ruleContext), registerControl(ruleContext)]);
  };
}

function buildScaffoldContext(
  options: Schema,
  type: ScaffoldType,
  project: ProjectDefinition,
  componentNaming: AngularComponentNaming,
  tree: Tree,
  context: SchematicContext,
) {
  const projectRoot = project.sourceRoot ?? project.root;

  const { automationConfig, mergedConfig } = loadMergedConfig(
    options,
    type,
    tree,
    projectRoot,
  );

  const resolvedName = mergedConfig.name ?? mergedConfig.key;
  const names = deriveNames(resolvedName, mergedConfig, componentNaming);

  const { componentPath, componentFilePath } = buildComponentPath(
    mergedConfig,
    projectRoot,
    resolvedName,
    names.componentFileName,
  );

  const viewProvider = resolveViewProvider(
    tree,
    projectRoot,
    automationConfig,
    mergedConfig,
    componentFilePath,
  );

  const controlRegistrationsPath = findControlRegistrationsPath(
    tree,
    projectRoot,
    automationConfig,
    context,
  );

  const ruleContext: ScaffoldContext = {
    ...mergedConfig,
    ...names,
    ...viewProvider,
    registrationType:
      automationConfig?.registrationType ?? DEFAULT_REGISTRATION_TYPE,
    resolvedName,
    componentPath,
    componentFilePath,
    projectRoot,
    controlRegistrationsPath,
  };

  return ruleContext;
}

function loadMergedConfig(
  options: Schema,
  type: ScaffoldType,
  tree: Tree,
  projectRoot: string,
) {
  const automationConfigPath = options.schematicsConfig
    ? `${projectRoot}/${options.schematicsConfig}`
    : findSchematicsConfig(tree);

  const automationConfig = readFile<NgxFormbarAutomationConfig | null>(
    tree,
    automationConfigPath,
  );
  const controlTypeConfig = automationConfig ? automationConfig[type] : {};

  const mergedConfig: Schema = { ...options, ...controlTypeConfig };

  return { automationConfig, mergedConfig };
}

function deriveNames(
  resolvedName: string,
  config: Schema,
  componentNaming: AngularComponentNaming,
) {
  const componentName = `${resolvedName}${config.componentSuffix ?? ''}`;
  const interfaceName = classify(
    `${resolvedName}${config.interfaceSuffix ?? ''}`,
  );

  const interfaceFileSegment =
    config.interfaceFileSuffix ??
    (componentNaming.type ? DEFAULT_INTERFACE_FILE_SUFFIX : '');

  return {
    componentName,
    componentFileName: buildFileName(componentName, componentNaming.type),
    componentClassName: buildClassName(componentName, componentNaming),
    interfaceName,
    interfaceFileName: buildFileName(interfaceName, interfaceFileSegment),
  };
}

function buildFileName(name: string, segment: string) {
  const normalizedSegment = segment.replace(/^\.+/, '');
  const baseName = dasherize(name);

  return normalizedSegment
    ? `${baseName}.${dasherize(normalizedSegment)}`
    : baseName;
}

function buildClassName(name: string, componentNaming: AngularComponentNaming) {
  const { addTypeToClassName, type } = componentNaming;
  const typeSuffix = addTypeToClassName && type ? classify(type) : '';

  return `${classify(name)}${typeSuffix}`;
}

function buildComponentPath(
  config: Schema,
  projectRoot: string,
  resolvedName: string,
  componentFileName: string,
) {
  const pathOption = config.path ?? 'app';
  const rootPath = pathOption.startsWith(projectRoot) ? '' : projectRoot;
  const componentPath = `${rootPath}/${pathOption}/${resolvedName}`;

  return {
    componentPath,
    componentFilePath: `/${componentPath}/${componentFileName}`,
  };
}

function resolveViewProvider(
  tree: Tree,
  projectRoot: string,
  automationConfig: NgxFormbarAutomationConfig | null,
  config: Schema,
  componentFilePath: string,
) {
  const pathOption =
    automationConfig?.viewProviderHelperPath ?? config.viewProviderHelperPath;

  const [viewProviderHelperPath, viewProviderIdentifier] =
    resolveImportPathAndIdentifier(
      tree,
      projectRoot,
      componentFilePath,
      pathOption,
      DEFAULT_VIEW_PROVIDER_HELPER,
    );

  return {
    viewProviderHelperPath,
    viewProviderIdentifier,
    hasViewProviderHelper: !!viewProviderHelperPath,
  };
}

function findControlRegistrationsPath(
  tree: Tree,
  projectRoot: string,
  automationConfig: NgxFormbarAutomationConfig | null,
  context: SchematicContext,
) {
  const controlRegistrationsPath = automationConfig?.controlRegistrationsPath
    ? `/${projectRoot}/${automationConfig.controlRegistrationsPath}`
    : findConfigPath(tree, projectRoot);

  if (!controlRegistrationsPath) {
    context.logger.warn(
      'No configuration files provided or found! Registration will be skipped!',
    );
  }

  return controlRegistrationsPath;
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
