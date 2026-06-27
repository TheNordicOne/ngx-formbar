import { SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  getWorkspace,
  ProjectDefinition,
  WorkspaceDefinition,
} from '@schematics/angular/utility/workspace';
import { isJsonObject } from '@angular-devkit/core';
import { COMPONENT_SCHEMATIC } from './constants';

export async function getProject(
  tree: Tree,
  projectName?: string,
): Promise<ProjectDefinition> {
  return getProjectDefinition(await getWorkspace(tree), projectName);
}

export function getProjectDefinition(
  workspace: WorkspaceDefinition,
  projectName?: string,
): ProjectDefinition {
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
