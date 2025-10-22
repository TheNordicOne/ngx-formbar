import {
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicsException,
  Tree,
  url,
} from '@angular-devkit/schematics';
import { createHost } from './create-host';
import {
  JsonObject,
  normalize,
  strings,
  workspaces,
} from '@angular-devkit/core';

import { Schema } from './schema';
import * as path from 'path';
import {
  updateWorkspace,
  WorkspaceDefinition,
} from '@schematics/angular/utility';
import { findConfigPath, readFile } from './file';
import { PACKAGE_NAME } from '../ng-add/constants';
import { NgxFormworkAutomationConfig } from '../../shared/shared-config.type';
import { getSourceFile } from '../../shared/ast';
import {
  register,
  RegistrationOptions,
} from '../../shared/control-registration';
import { classify } from '@angular-devkit/core/src/utils/strings';

export function scaffoldAndRegister(
  options: Schema,
  type: 'control' | 'group' | 'block',
): Rule {
  return async (tree: Tree) => {
    const host = createHost(tree);
    const { workspace } = await workspaces.readWorkspace('/', host);

    const automationConfig = readFile<NgxFormworkAutomationConfig | null>(
      tree,
      options.configurationPath,
    );
    const schemaConfig = automationConfig ? automationConfig[type] : undefined;

    const projectName =
      (options.project ?? (workspace.extensions['defaultProject'] as string)) ||
      (() => {
        throw new SchematicsException('No project specified.');
      })();

    const project = workspace.projects.get(projectName);
    if (!project) {
      throw new SchematicsException(`Project "${projectName}" not found.`);
    }

    const sourceRoot = project.sourceRoot
      ? `${project.sourceRoot}/app`
      : `${project.root}/src/app`;

    const name = options.name ?? options.key;
    const interfaceName = classify(
      `${options.name ?? options.key}${schemaConfig?.interfaceSuffix ?? options.interfaceSuffix ?? ''}`,
    );

    const componentDir = `/${options.path ?? name}/${name}`;

    const componentName = `${name}${schemaConfig?.componentSuffix ?? options.componentSuffix ?? ''}`;
    const componentClassName = `${componentName}Component`;
    const componentFilePath = path.posix.join(
      componentDir,
      `${strings.dasherize(componentName)}.component`,
    );

    const viewProviderHelperPath =
      automationConfig?.viewProviderHelperPath ??
      options.viewProviderHelperPath;
    const hostDirectiveHelperPath =
      schemaConfig?.hostDirectiveHelperPath ?? options.hostDirectiveHelperPath;

    const templateSource = apply(url('./files'), [
      applyTemplates({
        ...options,
        name,
        interfaceName,
        componentName,
        componentClassName,
        hasViewProviderHelper: !!viewProviderHelperPath,
        viewProviderHelperPath,
        hasHostDirectiveHelper: !!hostDirectiveHelperPath,
        hostDirectiveHelperPath,
        ...strings,
      }),
      move(normalize(strings.dasherize(componentDir))),
    ]);

    // Register the component using the static API
    const configPath =
      automationConfig?.controlRegistrationsPath ??
      findConfigPath(tree, sourceRoot);

    if (!configPath) {
      console.warn(
        `No config file found under "${sourceRoot}". Skipping registration.`,
      );
      return chain([mergeWith(templateSource)]);
    }

    const registrationType = automationConfig?.registrationType ?? 'map';
    const sourceFile = getSourceFile(tree, configPath);
    const componentImportPath = componentFilePath;

    const registrationOptions: RegistrationOptions = {
      key: options.key,
      componentClassName: strings.classify(componentClassName),
      componentImportPath,
      registrationType,
    };

    const result = register(sourceFile, registrationOptions);

    result.configFile.formatText({ indentSize: 2, convertTabsToSpaces: true });
    tree.overwrite(configPath, result.configFile.getFullText());

    if (result.additionalFiles?.length) {
      result.additionalFiles.forEach((file) => {
        file.formatText({ indentSize: 2, convertTabsToSpaces: true });
        tree.overwrite(file.getFilePath(), file.getFullText());
      });
    }

    return chain([mergeWith(templateSource)]);
  };
}

export function updateSchematicConfig(
  schematicName: string,
  options: JsonObject,
  projectName?: string,
): Rule {
  return updateWorkspace((workspace: WorkspaceDefinition) => {
    // Determine which project to update
    const targetProject =
      projectName ?? (workspace.extensions['defaultProject'] as string);
    if (!targetProject) {
      throw new SchematicsException(
        `No projectName provided and workspace.defaultProject is not set.`,
      );
    }

    const projectDef = workspace.projects.get(targetProject);
    if (!projectDef) {
      throw new SchematicsException(
        `Project "${targetProject}" does not exist in the workspace.`,
      );
    }

    // Ensure the "schematics" extension exists on the project
    projectDef.extensions['schematics'] ??= {};
    const schematicsExt = projectDef.extensions['schematics'] as JsonObject;

    // Grab and merge existing schematic config
    const schematicKey = `${PACKAGE_NAME}:${schematicName}`;
    const existingConfig = (schematicsExt[schematicKey] ?? {}) as JsonObject;
    schematicsExt[schematicKey] = {
      ...existingConfig,
      ...options,
    };
  });
}
