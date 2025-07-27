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
import { registerComponentInConfig } from './ast';
import { Schema } from './schema';
import * as path from 'path';
import {
  updateWorkspace,
  WorkspaceDefinition,
} from '@schematics/angular/utility';
import { buildRelativePath } from '@schematics/angular/utility/find-module';

export function scaffoldAndRegister(
  options: Schema,
  type: 'control' | 'group' | 'block',
): Rule {
  return async (tree: Tree) => {
    const host = createHost(tree);
    const { workspace } = await workspaces.readWorkspace('/', host);

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
    const interfaceName = `${options.name ?? options.key}${options.interfaceSuffix}`;
    const componentDir = `/${options.path ?? name}/${name}`;

    const componentName = `${name}${options.componentSuffix}`;
    const componentClassName = `${componentName}Component`;
    const componentFilePath = path.posix.join(
      componentDir,
      `${strings.dasherize(componentName)}.component`,
    );

    const helperPath = options.helperPath ?? sourceRoot;

    const hasViewProviderHelper = tree.exists(
      path.join(helperPath, 'control-container.view-provider.ts'),
    );
    const hasHostDirectiveHelper = tree.exists(
      path.join(helperPath, `${type}.host-directive.ts`),
    );

    const helperImportPath = buildRelativePath(
      componentFilePath,
      path.posix.isAbsolute(helperPath) ? helperPath : `/${helperPath}`,
    );

    const templateSource = apply(url('./files'), [
      applyTemplates({
        ...options,
        name,
        interfaceName,
        componentName,
        componentClassName,
        hasViewProviderHelper,
        hasHostDirectiveHelper,
        helperImportPath,
        ...strings,
      }),
      move(normalize(strings.dasherize(componentDir))),
    ]);

    registerComponentInConfig(
      tree,
      sourceRoot,
      options.key,
      componentFilePath,
      componentClassName,
    );

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
    const schematicKey = `ngx-formwork:${schematicName}`;
    const existingConfig = (schematicsExt[schematicKey] ?? {}) as JsonObject;
    schematicsExt[schematicKey] = {
      ...existingConfig,
      ...options,
    };
  });
}
