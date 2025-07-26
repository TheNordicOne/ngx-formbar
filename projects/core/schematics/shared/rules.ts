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
import { normalize, strings, workspaces } from '@angular-devkit/core';
import { registerComponentInConfig } from './ast';
import { Schema } from './schema';
import * as path from 'path';

export function scaffoldAndRegister(options: Schema): Rule {
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

    const templateSource = apply(url('./files'), [
      applyTemplates({
        ...options,
        name,
        interfaceName,
        componentName,
        componentClassName,
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
