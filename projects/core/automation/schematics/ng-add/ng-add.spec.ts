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
import { normalize } from '@angular-devkit/core';

const COLLECTION_PATH = join(
  __dirname,
  '../../../../../dist/core/schematics/collection.json',
);

describe('ng-add schematic', () => {
  const baseOptions = { project: 'test-app' };
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);
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

    appTree = await runner.runExternalSchematic(
      '@schematics/angular',
      'application',
      appOptions,
      workspaceTree,
    );
  });

  it('should generate token provider files by default', async () => {
    const tree = await runner.runSchematic('ng-add', baseOptions, appTree);

    expect(tree.files).toContain(
      '/projects/test-app/src/app/component-registrations.provider.ts',
    );
    expect(tree.files).toContain(
      '/projects/test-app/src/app/validator-registrations.provider.ts',
    );

    expect(tree.files).not.toContain(
      '/projects/test-app/src/app/formwork.config.ts',
    );

    const compProv = tree.readContent(
      '/projects/test-app/src/app/component-registrations.provider.ts',
    );
    expect(compProv).toContain(
      "import { NGX_FW_COMPONENT_REGISTRATIONS } from 'ngx-formwork'",
    );
    expect(compProv).toContain('useValue: new Map([');

    const valProv = tree.readContent(
      '/projects/test-app/src/app/validator-registrations.provider.ts',
    );
    expect(valProv).toContain(
      "import { NGX_FW_VALIDATOR_REGISTRATIONS, NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS } from 'ngx-formwork'",
    );
    expect(valProv).toContain('export const validatorRegistrationsProvider');
    expect(valProv).toContain(
      'export const asyncValidatorRegistrationsProvider',
    );
  });

  it('should update app.config.ts for token-based setup (default)', async () => {
    const tree = await runner.runSchematic('ng-add', baseOptions, appTree);

    expect(tree.files).not.toContain(
      '/projects/test-app/src/app/formwork.config.ts',
    );

    const content = tree.readContent(
      '/projects/test-app/src/app/app.config.ts',
    );

    expect(content).toContain('provideFormwork()');
    expect(content).toContain("import { provideFormwork } from 'ngx-formwork'");

    expect(content).toContain(
      "import { componentRegistrationsProvider } from './component-registrations.provider'",
    );
    expect(content).toContain(
      "import { validatorRegistrationsProvider, asyncValidatorRegistrationsProvider } from './validator-registrations.provider'",
    );

    const pfwIdx = content.indexOf('provideFormwork()');
    const compIdx = content.indexOf('componentRegistrationsProvider');
    expect(pfwIdx).toBeGreaterThanOrEqual(0);
    expect(compIdx).toBeGreaterThan(pfwIdx);
  });

  it('should generate helper files and configure schematic helperPath in angular.json', async () => {
    const helperPath = 'projects/test-app/src/app/shared/helper';
    const absoluteHelperPath = `/${helperPath}`;
    const options = { ...baseOptions, helper: true };
    const tree = await runner.runSchematic('ng-add', options, appTree);

    console.dir(tree.files);
    expect(tree.files).toContain(
      normalize(absoluteHelperPath + '/block.host-directive.ts'),
    );
    expect(tree.files).toContain(
      normalize(absoluteHelperPath + '/control.host-directive.ts'),
    );
    expect(tree.files).toContain(
      normalize(absoluteHelperPath + '/control-container.view-provider.ts'),
    );
    expect(tree.files).toContain(
      normalize(absoluteHelperPath + '/group.host-directive.ts'),
    );

    const workspaceDef: WorkspaceDefinition = await getWorkspace(tree);
    const projectDef = workspaceDef.projects.get('test-app');
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

  it('should generate formwork.config.ts and wire provideFormwork(formworkConfig) when --config is set', async () => {
    const tree = await runner.runSchematic(
      'ng-add',
      { ...baseOptions, config: true },
      appTree,
    );

    expect(tree.files).toContain(
      '/projects/test-app/src/app/formwork.config.ts',
    );

    expect(tree.files).not.toContain(
      '/projects/test-app/src/app/component-registrations.provider.ts',
    );
    expect(tree.files).not.toContain(
      '/projects/test-app/src/app/validator-registrations.provider.ts',
    );

    const configContent = tree.readContent(
      '/projects/test-app/src/app/formwork.config.ts',
    );
    expect(configContent).toContain('import { defineFormworkConfig } from');
    expect(configContent).toContain(
      'export const formworkConfig = defineFormworkConfig',
    );

    const appConfig = tree.readContent(
      '/projects/test-app/src/app/app.config.ts',
    );
    expect(appConfig).toContain('provideFormwork(formworkConfig)');
    expect(appConfig).toContain(
      "import { formworkConfig } from './formwork.config'",
    );
  });

  it('respects includeSyncValidators/includeAsyncValidators for token setup', async () => {
    const treeAsyncOnly = await runner.runSchematic(
      'ng-add',
      {
        ...baseOptions,
        includeSyncValidators: false,
        includeAsyncValidators: true,
      },
      appTree,
    );

    expect(treeAsyncOnly.files).toContain(
      '/projects/test-app/src/app/validator-registrations.provider.ts',
    );
    const asyncOnlyContent = treeAsyncOnly.readContent(
      '/projects/test-app/src/app/validator-registrations.provider.ts',
    );
    expect(asyncOnlyContent).toContain(
      "import { NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS } from 'ngx-formwork'",
    );
    expect(asyncOnlyContent).not.toContain('NGX_FW_VALIDATOR_REGISTRATIONS');
    expect(asyncOnlyContent).toContain(
      'export const asyncValidatorRegistrationsProvider',
    );
    expect(asyncOnlyContent).not.toContain(
      'export const validatorRegistrationsProvider',
    );

    const appConfigAsyncOnly = treeAsyncOnly.readContent(
      '/projects/test-app/src/app/app.config.ts',
    );
    expect(appConfigAsyncOnly).toContain(
      "import { asyncValidatorRegistrationsProvider } from './validator-registrations.provider'",
    );
    expect(appConfigAsyncOnly).not.toContain('validatorRegistrationsProvider');

    const treeSyncOnly = await runner.runSchematic(
      'ng-add',
      {
        ...baseOptions,
        includeSyncValidators: true,
        includeAsyncValidators: false,
      },
      appTree,
    );

    const syncOnlyContent = treeSyncOnly.readContent(
      '/projects/test-app/src/app/validator-registrations.provider.ts',
    );
    expect(syncOnlyContent).toContain(
      "import { NGX_FW_VALIDATOR_REGISTRATIONS } from 'ngx-formwork'",
    );
    expect(syncOnlyContent).not.toContain(
      'NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS',
    );
    expect(syncOnlyContent).toContain(
      'export const validatorRegistrationsProvider',
    );
    expect(syncOnlyContent).not.toContain(
      'export const asyncValidatorRegistrationsProvider',
    );

    const appConfigSyncOnly = treeSyncOnly.readContent(
      '/projects/test-app/src/app/app.config.ts',
    );
    expect(appConfigSyncOnly).toContain(
      "import { validatorRegistrationsProvider } from './validator-registrations.provider'",
    );
    expect(appConfigSyncOnly).not.toContain(
      'asyncValidatorRegistrationsProvider',
    );

    const treeNoValidators = await runner.runSchematic(
      'ng-add',
      {
        ...baseOptions,
        includeSyncValidators: false,
        includeAsyncValidators: false,
      },
      appTree,
    );

    expect(treeNoValidators.files).not.toContain(
      '/projects/test-app/src/app/validator-registrations.provider.ts',
    );
    const appConfigNoVal = treeNoValidators.readContent(
      '/projects/test-app/src/app/app.config.ts',
    );
    expect(appConfigNoVal).not.toContain('validatorRegistrationsProvider');
    expect(appConfigNoVal).not.toContain('asyncValidatorRegistrationsProvider');
  });

  it('respects includeSyncValidators/includeAsyncValidators for config setup', async () => {
    const treeDefault = await runner.runSchematic(
      'ng-add',
      { ...baseOptions, config: true },
      appTree,
    );
    const cfgDefault = treeDefault.readContent(
      '/projects/test-app/src/app/formwork.config.ts',
    );
    expect(cfgDefault).toContain('componentRegistrations');
    expect(cfgDefault).toContain('validatorRegistrations');
    expect(cfgDefault).toContain('asyncValidatorRegistrations');

    const treeSyncOnly = await runner.runSchematic(
      'ng-add',
      {
        ...baseOptions,
        config: true,
        includeSyncValidators: true,
        includeAsyncValidators: false,
      },
      appTree,
    );
    const cfgSyncOnly = treeSyncOnly.readContent(
      '/projects/test-app/src/app/formwork.config.ts',
    );
    expect(cfgSyncOnly).toContain('validatorRegistrations');
    expect(cfgSyncOnly).not.toContain('asyncValidatorRegistrations');

    const treeAsyncOnly = await runner.runSchematic(
      'ng-add',
      {
        ...baseOptions,
        config: true,
        includeSyncValidators: false,
        includeAsyncValidators: true,
      },
      appTree,
    );
    const cfgAsyncOnly = treeAsyncOnly.readContent(
      '/projects/test-app/src/app/formwork.config.ts',
    );
    expect(cfgAsyncOnly).not.toContain('validatorRegistrations');
    expect(cfgAsyncOnly).toContain('asyncValidatorRegistrations');

    const treeNone = await runner.runSchematic(
      'ng-add',
      {
        ...baseOptions,
        config: true,
        includeSyncValidators: false,
        includeAsyncValidators: false,
      },
      appTree,
    );
    const cfgNone = treeNone.readContent(
      '/projects/test-app/src/app/formwork.config.ts',
    );
    expect(cfgNone).toContain('componentRegistrations');
    expect(cfgNone).not.toContain('validatorRegistrations');
    expect(cfgNone).not.toContain('asyncValidatorRegistrations');
  });
});
