import {
  chain,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core';
import { posix } from 'node:path';

import { ScaffoldContext, ScaffoldType, Schema } from '../schema';
import {
  AngularComponentNaming,
  DEFAULT_REGISTRATION_TYPE,
  exportsIdentifier,
  getAngularComponentNaming,
  getProjectDefinition,
  isWithin,
  joinToSourceRoot,
  loadAutomationConfig,
  NgxFormbarAutomationConfig,
  otherProjectDirectories,
  registrationsNotFoundMessage,
  resolveRegistrationsPath,
  resolveRequiredPath,
  resolveWithinWorkspace,
} from '@ngx-formbar/setup';
import {
  DEFAULT_INTERFACE_FILE_SUFFIX,
  DEFAULT_VIEW_PROVIDER_HELPER,
} from '../constants';
import { createComponent } from './create-component.rule';
import { registerControl } from './register-control.rule';
import { registerUnion } from './register-union.rule';
import {
  getWorkspace,
  ProjectDefinition,
  WorkspaceDefinition,
} from '@schematics/angular/utility/workspace';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { splitHashReference } from '../type-reference';

const { classify, dasherize } = strings;

export function scaffoldAndRegister(options: Schema, type: ScaffoldType): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const workspace = await getWorkspace(tree);
    const project = getProjectDefinition(workspace, options.project);
    const componentNaming = getAngularComponentNaming(workspace, project);

    const ruleContext = buildScaffoldContext(
      options,
      type,
      workspace,
      project,
      componentNaming,
      tree,
      context,
    );

    return chain([
      createComponent(ruleContext),
      registerControl(ruleContext),
      registerUnion(ruleContext),
    ]);
  };
}

function buildScaffoldContext(
  options: Schema,
  type: ScaffoldType,
  workspace: WorkspaceDefinition,
  project: ProjectDefinition,
  componentNaming: AngularComponentNaming,
  tree: Tree,
  context: SchematicContext,
) {
  const sourceRoot = project.sourceRoot ?? project.root;

  const { automationConfig, typeConfig, mergedConfig } = loadMergedConfig(
    options,
    type,
    tree,
    sourceRoot,
    context,
  );

  const resolvedName = mergedConfig.name ?? mergedConfig.key;
  const names = deriveNames(resolvedName, mergedConfig, componentNaming);

  const directory = typeConfig?.path
    ? resolveRequiredPath(`${type}.path`, typeConfig.path, sourceRoot)
    : resolvePathOption(options.path, project, workspace);
  const componentPath = `${directory}/${dasherize(resolvedName)}`;
  const componentFilePath = `${componentPath}/${names.componentFileName}`;

  const viewProvider = resolveViewProvider(
    tree,
    sourceRoot,
    automationConfig,
    mergedConfig,
    componentFilePath,
    type,
    context,
  );

  const controlRegistrationsPath = findControlRegistrationsPath(
    tree,
    sourceRoot,
    automationConfig?.controlRegistrationsPath ??
      options.controlRegistrationsPath,
    context,
  );

  const ruleContext: ScaffoldContext = {
    ...mergedConfig,
    ...names,
    ...viewProvider,
    registrationType:
      automationConfig?.registrationType ??
      options.registrationType ??
      DEFAULT_REGISTRATION_TYPE,
    registrationKind: type,
    contentTypeReference: automationConfig?.schema?.type,
    resolvedName,
    componentPath,
    componentFilePath,
    sourceRoot,
    controlRegistrationsPath,
  };

  return ruleContext;
}

function loadMergedConfig(
  options: Schema,
  type: ScaffoldType,
  tree: Tree,
  sourceRoot: string,
  context: SchematicContext,
) {
  const automationConfig = loadAutomationConfig(
    tree,
    sourceRoot,
    context.logger,
    options.schematicsConfig,
  );
  const typeConfig = automationConfig?.[type];

  const mergedConfig: Schema = { ...options, ...typeConfig };

  return { automationConfig, typeConfig, mergedConfig };
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

/**
 * A leading `/` is explicit and means the workspace root. Without one, as the
 * CLI supplies it, `--path` is workspace-relative when it lies in the project.
 * Any other path is read relative to the source root. A path in another project
 * fails, so a component never lands there while registering in this one.
 */
function resolvePathOption(
  path: string | undefined,
  project: ProjectDefinition,
  workspace: WorkspaceDefinition,
) {
  const sourceRoot = project.sourceRoot ?? project.root;

  if (!path) {
    return joinToSourceRoot('app', sourceRoot);
  }

  const fromWorkspace = resolveWithinWorkspace(`/${path}`, sourceRoot);
  const resolved = resolveRequiredPath(
    'path',
    fromWorkspace && isWithin(fromWorkspace.slice(1), project.root)
      ? fromWorkspace
      : path,
    sourceRoot,
  );
  const otherProjects = otherProjectDirectories(project, workspace);
  const inOtherProject = [fromWorkspace, resolved].some(
    (candidate) =>
      candidate &&
      otherProjects.some((directory) =>
        isWithin(candidate.slice(1), directory),
      ),
  );

  if (inOtherProject) {
    throw new SchematicsException(
      `"path" lies inside another project: ${path}`,
    );
  }

  return resolved;
}

function resolveViewProvider(
  tree: Tree,
  sourceRoot: string,
  automationConfig: NgxFormbarAutomationConfig | null,
  config: Schema,
  componentFilePath: string,
  type: ScaffoldType,
  context: SchematicContext,
) {
  // A block's template has no view providers.
  const pathOption =
    type === 'block'
      ? undefined
      : (automationConfig?.viewProviderHelperPath ??
        config.viewProviderHelperPath);

  const [viewProviderHelperPath, viewProviderIdentifier] =
    resolveImportPathAndIdentifier(
      tree,
      sourceRoot,
      componentFilePath,
      pathOption,
      DEFAULT_VIEW_PROVIDER_HELPER,
      context,
    );

  return {
    viewProviderHelperPath,
    viewProviderIdentifier,
    hasViewProviderHelper: !!viewProviderHelperPath,
  };
}

function findControlRegistrationsPath(
  tree: Tree,
  sourceRoot: string,
  configuredPath: string | undefined,
  context: SchematicContext,
) {
  const controlRegistrationsPath =
    resolveRegistrationsPath(tree, sourceRoot, configuredPath) ?? undefined;

  if (!controlRegistrationsPath) {
    context.logger.warn(
      configuredPath
        ? registrationsNotFoundMessage(configuredPath)
        : 'No configuration files provided or found! Registration will be skipped!',
    );
  }

  return controlRegistrationsPath;
}

function resolveImportPathAndIdentifier(
  tree: Tree,
  sourceRoot: string,
  componentFilePath: string,
  pathOption: string | undefined,
  defaultFileOption: string,
  context: SchematicContext,
) {
  if (!pathOption) {
    return [];
  }
  const { directory, fileName, identifier, namesFile } = extractFromPath(
    pathOption,
    defaultFileOption,
  );

  const resolvedDirectory = resolveWithinWorkspace(directory, sourceRoot);

  if (!resolvedDirectory) {
    warnHelperNotFound(pathOption, context);
    return [];
  }

  const helperFile = posix.join(resolvedDirectory, fileName);

  const importPath =
    !namesFile &&
    exportsIdentifier(
      tree,
      posix.join(resolvedDirectory, 'index.ts'),
      identifier,
    )
      ? resolvedDirectory
      : helperFile;

  if (importPath === helperFile && !tree.exists(`${helperFile}.ts`)) {
    warnHelperNotFound(`${helperFile}.ts`, context);
    return [];
  }

  return [buildRelativePath(componentFilePath, importPath), identifier];
}

function warnHelperNotFound(path: string, context: SchematicContext) {
  context.logger.warn(
    `View provider helper ${path} could not be found. Using the verbose syntax.`,
  );
}

const EXT_REGEX = /\.ts$/i;

function extractFromPath(inputSpec: string, defaultSpec: string) {
  const inputParts = splitHashReference(inputSpec);
  const defaultParts = splitHashReference(defaultSpec);

  const inputPathParts = splitPath(inputParts.path);
  const defaultPathParts = splitPath(defaultParts.path);

  const directory = inputPathParts.directory;

  const fileName = (
    inputPathParts.fileName || defaultPathParts.fileName
  ).replace('.ts', '');

  const identifier = inputParts.exportName || defaultParts.exportName;

  return {
    directory,
    fileName,
    identifier,
    namesFile: !!inputPathParts.fileName,
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

  return EXT_REGEX.test(lastSegment)
    ? { directory: posix.dirname(normalizedPath), fileName: lastSegment }
    : { directory: normalizedPath.replace(/(?<=.)\/$/, ''), fileName: '' };
}
