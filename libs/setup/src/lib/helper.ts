import { SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  getWorkspace,
  ProjectDefinition,
} from '@schematics/angular/utility/workspace';

export async function getProject(
  tree: Tree,
  projectName?: string,
): Promise<ProjectDefinition> {
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
