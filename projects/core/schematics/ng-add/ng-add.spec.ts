import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';

const collectionPath = path.join(__dirname, '../collection.json');
const runner = new SchematicTestRunner('ngx-formwork', collectionPath);

describe.skip('ng-add schematic', () => {
  let appTree: UnitTestTree;

  beforeEach(async () => {
    // Create a mock workspace + app
    const workspaceOptions: WorkspaceOptions = {
      name: 'workspace',
      version: '19.0.0',
      newProjectRoot: 'projects',
    };

    appTree = await runner.runExternalSchematic(
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
      appTree,
    );
  });

  it('should generate formwork.config.ts', async () => {
    const tree = await runner.runSchematic('ng-add', {}, appTree);
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
    const tree = await runner.runSchematic('ng-add', {}, appTree);
    const content = tree.readContent('/projects/app/src/app/app.config.ts');
    expect(content).toContain('provideFormwork(formworkConfig)');
    expect(content).toContain(
      "import { formworkConfig } from './formwork.config'",
    );
    expect(content).toContain("import { provideFormwork } from 'ngx-formwork'");
  });
});
