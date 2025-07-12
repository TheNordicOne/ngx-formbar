import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');
const runner = new SchematicTestRunner('ngx-formwork', collectionPath);

describe('ng-add schematic', () => {
  let appTree: UnitTestTree;

  beforeEach(async () => {
    // Create a mock workspace + app
    appTree = await runner.runExternalSchematic(
      '@schematics/angular',
      'workspace',
      {
        name: 'workspace',
        version: '19.0.0',
        newProjectRoot: 'projects',
      },
    );

    appTree = await runner.runExternalSchematic(
      '@schematics/angular',
      'application',
      {
        name: 'app',
        standalone: true,
      },
      appTree,
    );
  });

  it('should generate formwork.config.ts', async () => {
    const tree = await runner.runSchematic('ng-add', {}, appTree);
    expect(tree.files).toContain('/projects/app/src/app/formwork.config.ts');
  });

  it('should update app.config.ts', async () => {
    const tree = await runner.runSchematic('ng-add', {}, appTree);
    const content = tree.readContent('/projects/app/src/app/app.config.ts');
    expect(content).toContain('provideFormwork(formworkConfig)');
    expect(content).toContain(
      "import { formworkConfig } from './formwork.config'",
    );
  });
});
