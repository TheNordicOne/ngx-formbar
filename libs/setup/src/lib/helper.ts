import { SchematicsException } from '@angular-devkit/schematics';
import {
  ProjectDefinition,
  WorkspaceDefinition,
} from '@schematics/angular/utility/workspace';
import { isJsonObject, normalize } from '@angular-devkit/core';
import { COMPONENT_SCHEMATIC } from './constants';
import { isWithin } from './source-root-path';

export function resolveProjectName(
  workspace: WorkspaceDefinition,
  projectName?: string,
): string {
  projectName ??= workspace.extensions['defaultProject'] as string;

  if (!projectName) {
    throw new SchematicsException(
      'No project specified and no default project found.',
    );
  }

  return projectName;
}

export function getProjectDefinition(
  workspace: WorkspaceDefinition,
  projectName?: string,
): ProjectDefinition {
  const resolvedName = resolveProjectName(workspace, projectName);
  const project = workspace.projects.get(resolvedName);

  if (!project) {
    throw new SchematicsException(
      `Project "${resolvedName}" not found in workspace.`,
    );
  }

  return project;
}

/**
 * Directories of other projects, without a leading `/`. Those containing
 * `project` are left out, as every path in the project lies within them.
 */
export function otherProjectDirectories(
  project: ProjectDefinition,
  workspace: WorkspaceDefinition,
): string[] {
  const directoriesOf = ({ root, sourceRoot }: ProjectDefinition) =>
    [root, sourceRoot ?? root].map((path) => normalize(`/${path}`).slice(1));
  const own = directoriesOf(project);

  return [...workspace.projects.values()]
    .flatMap(directoriesOf)
    .filter(
      (directory) =>
        !own.includes(directory) && !isWithin(project.root, directory),
    );
}

/** `path` has no leading `/`. A project nested in `project` is not part of it. */
export function isInsideProject(
  path: string,
  project: ProjectDefinition,
  workspace: WorkspaceDefinition,
): boolean {
  return (
    isWithin(path, project.root) &&
    !otherProjectDirectories(project, workspace).some((directory) =>
      isWithin(path, directory),
    )
  );
}

/**
 * Component naming taken from `@schematics/angular:component`: `type` is the
 * file and class suffix, `addTypeToClassName` gates whether the class gets it.
 */
export interface AngularComponentNaming {
  type: string;
  addTypeToClassName: boolean;
}

/**
 * Project-level `@schematics/angular:component` config wins over workspace-level.
 */
export function getAngularComponentNaming(
  workspace: WorkspaceDefinition,
  project: ProjectDefinition,
): AngularComponentNaming {
  const config = {
    ...readComponentSchematicConfig(workspace.extensions),
    ...readComponentSchematicConfig(project.extensions),
  };

  const type = config['type'];
  const addTypeToClassName = config['addTypeToClassName'];

  return {
    type: typeof type === 'string' ? type : '',
    addTypeToClassName:
      typeof addTypeToClassName === 'boolean' ? addTypeToClassName : true,
  };
}

function readComponentSchematicConfig(
  extensions: ProjectDefinition['extensions'],
) {
  const schematics = extensions['schematics'];

  if (!schematics || !isJsonObject(schematics)) {
    return undefined;
  }

  const entry = schematics[COMPONENT_SCHEMATIC];

  if (!isJsonObject(entry)) {
    return undefined;
  }

  return entry;
}
