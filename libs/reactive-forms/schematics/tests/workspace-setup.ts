import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';

export async function setupWorkspace(
  runner: SchematicTestRunner,
): Promise<UnitTestTree> {
  const workspaceOptions: WorkspaceOptions = {
    name: 'workspace',
    version: '19.0.0',
    newProjectRoot: 'projects',
  };

  const workspaceTree = await runner.runExternalSchematic(
    '@schematics/angular',
    'workspace',
    workspaceOptions,
  );

  const appOptions: ApplicationOptions = {
    name: 'test-app',
    standalone: true,
  };

  return await runner.runExternalSchematic(
    '@schematics/angular',
    'application',
    appOptions,
    workspaceTree,
  );
}
