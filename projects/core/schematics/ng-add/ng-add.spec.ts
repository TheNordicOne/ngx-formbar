import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';
import { join } from 'path';
import {
  getWorkspace,
  WorkspaceDefinition,
} from '@schematics/angular/utility/workspace';

const COLLECTION_PATH = join(
  __dirname,
  '../../../../dist/core/schematics/collection.json',
);

describe('ng-add schematic', () => {
  const baseOptions = { project: 'app' };
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);
    // Create a mock workspace + app
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
      name: 'app',
      standalone: true,
    };

    appTree = await runner.runExternalSchematic(
      '@schematics/angular',
      'application',
      appOptions,
      workspaceTree,
    );
  });

  it('should generate formwork.config.ts', async () => {
    const tree = await runner.runSchematic('ng-add', baseOptions, appTree);
    expect(tree.files).toContain('/projects/app/src/app/formwork.config.ts');

    const configContent = tree.readContent(
      '/projects/app/src/app/formwork.config.ts',
    );
    expect(configContent).toContain('import { defineFormworkConfig } from');
    expect(configContent).toContain(
      'export const formworkConfig = defineFormworkConfig',
    );
  });

  it('should update app.config.ts', async () => {
    const tree = await runner.runSchematic('ng-add', baseOptions, appTree);
    const content = tree.readContent('/projects/app/src/app/app.config.ts');
    expect(content).toContain('provideFormwork(formworkConfig)');
    expect(content).toContain(
      "import { formworkConfig } from './formwork.config'",
    );
    expect(content).toContain("import { provideFormwork } from 'ngx-formwork'");
  });

  it('should generate helper files and configure schematic helperPath in angular.json', async () => {
    const helperPath = 'projects/app/src/app/shared/helper';
    const absoluteHelperPath = `/${helperPath}`;
    const options = { ...baseOptions, helper: true };
    const tree = await runner.runSchematic('ng-add', options, appTree);

    // Verify helper files generated
    expect(tree.files).toContain(
      absoluteHelperPath + '/block.host-directive.ts',
    );
    expect(tree.files).toContain(
      absoluteHelperPath + '/control.host-directive.ts',
    );
    expect(tree.files).toContain(
      absoluteHelperPath + '/control-container.view-provider.ts',
    );
    expect(tree.files).toContain(
      absoluteHelperPath + '/group.host-directive.ts',
    );

    // Verify angular.json updated with helperPath for schematics using typed workspace
    const workspaceDef: WorkspaceDefinition = await getWorkspace(tree);
    const projectDef = workspaceDef.projects.get('app');
    expect(projectDef).toBeDefined();
    if (!projectDef) {
      throw new Error('Project definition should exist');
    }
    const schematicsConfig = (projectDef.extensions['schematics'] ??
      {}) as Record<string, { helperPath: string }>;
    expect(schematicsConfig['ngx-formwork:control'].helperPath).toBe(
      helperPath,
    );
    expect(schematicsConfig['ngx-formwork:group'].helperPath).toBe(helperPath);
    expect(schematicsConfig['ngx-formwork:block'].helperPath).toBe(helperPath);
  });
});
