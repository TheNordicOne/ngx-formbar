import { beforeEach, describe, expect } from 'vitest';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';

import {
  addComponentFiles,
  COLLECTION_PATH,
  createControlComponent,
  createUnrelatedComponent,
  helperProviders,
  inlineProviders,
  provideMap,
  provideToken,
  setupWorkspace,
  TestComponentDetails
} from './workspace-setup';
import {
  app,
  countComponentRegistrationsMapProviderIdentifier,
  countNamedImport,
  forEachAtLeastOnce,
  read,
  src,
  writeJson
} from './helper';
import { DiscoverOptions } from '../register/schema';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { SourceFile } from 'typescript';
import {
  componentRegistrationsMapProviderHasIdentifier,
  directComponentRegistrationsHasIdentifier
} from '../shared/ast/registrations';
import { parseTS } from '../shared/ast/parse';
import { hasNamedImport } from '../shared/ast/imports';
import { NgxFormbarAutomationConfig } from '../../shared/shared-config.type';

describe('register schematic', () => {
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;

  const baseOptions: DiscoverOptions = {
    project: 'test-app',
  };

  const appConfigPathRaw = 'app.config.ts';
  const formbarConfigPath = 'app/formbar.config.ts';
  const schematicsConfigPath = 'app/formbar.config.json';
  const registrationsPath = 'app/registrations/component-registrations.ts';

  async function runSchematic(options: Partial<DiscoverOptions> = {}) {
    return runner.runSchematic(
      'register',
      { ...baseOptions, ...options },
      appTree,
    );
  }

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);
    appTree = await setupWorkspace(runner);
  });

  it('finds and registers components anywhere, with and without helper', async () => {
    const files: TestComponentDetails[] = [
      {
        path: app('components/form/controls/inline.component.ts'),
        content: createControlComponent(
          'inline',
          inlineProviders,
          'InlineComponent',
        ),
        className: 'InlineComponent',
        key: 'inline',
      },
      {
        path: app('components/form/controls/helper.component.ts'),
        content: createControlComponent(
          'helper',
          helperProviders,
          'HelperComponent',
        ),
        className: 'HelperComponent',
        key: 'helper',
      },
      {
        path: app(
          'features/account/profile/controls/profile-inline.component.ts',
        ),
        content: createControlComponent(
          'profile-inline',
          inlineProviders,
          'ProfileInlineComponent',
        ),
        className: 'ProfileInlineComponent',
        key: 'profile-inline',
      },
      {
        path: app(
          'features/account/profile/controls/profile-helper.component.ts',
        ),
        content: createControlComponent(
          'profile-helper',
          helperProviders,
          'ProfileHelperComponent',
        ),
        className: 'ProfileHelperComponent',
        key: 'profile-helper',
      },
      {
        path: app('root-inline.component.ts'),
        content: createControlComponent(
          'root-inline',
          inlineProviders,
          'RootInlineComponent',
        ),
        className: 'RootInlineComponent',
        key: 'root-inline',
      },
      {
        path: app('root-helper.component.ts'),
        content: createControlComponent(
          'root-helper',
          helperProviders,
          'RootHelperComponent',
        ),
        className: 'RootHelperComponent',
        key: 'root-helper',
      },
    ];

    addComponentFiles(appTree, files);
    provideToken(appTree, appConfigPathRaw, registrationsPath);

    const tree = await runSchematic();

    assertRegisteredComponents(
      tree,
      files,
      src(registrationsPath),
      componentRegistrationsMapProviderHasIdentifier,
    );
  });

  it('ignores invalid components', async () => {
    const files: TestComponentDetails[] = [
      {
        path: app('components/form/controls/inline.component.ts'),
        content: createControlComponent(
          'inline',
          inlineProviders,
          'InlineComponent',
        ),
        className: 'InlineComponent',
        key: 'inline',
      },
      {
        path: app('components/form/controls/helper.component.ts'),
        content: createUnrelatedComponent('helper', 'HelperComponent'),
        className: 'HelperComponent',
        key: 'helper',
        shouldRegister: false,
      },
    ];

    addComponentFiles(appTree, files);
    provideToken(appTree, appConfigPathRaw, registrationsPath);

    const tree = await runSchematic();

    assertRegisteredComponents(
      tree,
      files,
      src(registrationsPath),
      componentRegistrationsMapProviderHasIdentifier,
    );
  });

  it('respects exclude pattern', async () => {
    const files: TestComponentDetails[] = [
      {
        path: app('components/form/controls/inline.component.ts'),
        content: createControlComponent(
          'inline',
          inlineProviders,
          'InlineComponent',
        ),
        className: 'InlineComponent',
        key: 'inline',
      },
      {
        path: app('components/form/controls/helper.component.ts'),
        content: createControlComponent(
          'helper',
          helperProviders,
          'HelperComponent',
        ),
        className: 'HelperComponent',
        key: 'helper',
      },
      {
        path: app(
          'features/account/profile/controls/profile-inline.component.ts',
        ),
        content: createControlComponent(
          'profile-inline',
          inlineProviders,
          'ProfileInlineComponent',
        ),
        className: 'ProfileInlineComponent',
        key: 'profile-inline',
        shouldRegister: false,
      },
      {
        path: app(
          'features/account/profile/controls/profile-helper.component.ts',
        ),
        content: createControlComponent(
          'profile-helper',
          helperProviders,
          'ProfileHelperComponent',
        ),
        className: 'ProfileHelperComponent',
        key: 'profile-helper',
        shouldRegister: false,
      },
      {
        path: app('features/login/controls/password-input.component.ts'),
        content: createControlComponent(
          'profile-helper',
          helperProviders,
          'PasswordInputComponent',
        ),
        className: 'PasswordInputComponent',
        key: 'password-input',
        shouldRegister: false,
      },
    ];

    addComponentFiles(appTree, files);
    provideToken(appTree, appConfigPathRaw, registrationsPath);

    const tree = await runSchematic({
      exclude: ['**/account/**', app('features/login/controls/**')],
    });

    assertRegisteredComponents(
      tree,
      files,
      src(registrationsPath),
      componentRegistrationsMapProviderHasIdentifier,
    );
  });

  it('respects exclude pattern', async () => {
    const files: TestComponentDetails[] = [
      {
        path: app('components/form/controls/inline.component.ts'),
        content: createControlComponent(
          'inline',
          inlineProviders,
          'InlineComponent',
        ),
        className: 'InlineComponent',
        key: 'inline',
        shouldRegister: false,
      },
      {
        path: app('components/form/controls/helper.component.ts'),
        content: createControlComponent(
          'helper',
          helperProviders,
          'HelperComponent',
        ),
        className: 'HelperComponent',
        key: 'helper',
        shouldRegister: false,
      },
      {
        path: app(
          'features/account/profile/controls/profile-inline.component.ts',
        ),
        content: createControlComponent(
          'profile-inline',
          inlineProviders,
          'ProfileInlineComponent',
        ),
        className: 'ProfileInlineComponent',
        key: 'profile-inline',
      },
      {
        path: app(
          'features/account/profile/controls/profile-helper.component.ts',
        ),
        content: createControlComponent(
          'profile-helper',
          helperProviders,
          'ProfileHelperComponent',
        ),
        className: 'ProfileHelperComponent',
        key: 'profile-helper',
      },
      {
        path: app('features/login/controls/password-input.component.ts'),
        content: createControlComponent(
          'profile-helper',
          helperProviders,
          'PasswordInputComponent',
        ),
        className: 'PasswordInputComponent',
        key: 'password-input',
        shouldRegister: false,
      },
    ];

    addComponentFiles(appTree, files);
    provideToken(appTree, appConfigPathRaw, registrationsPath);

    const tree = await runSchematic({
      include: ['**/account/**'],
    });

    assertRegisteredComponents(
      tree,
      files,
      src(registrationsPath),
      componentRegistrationsMapProviderHasIdentifier,
    );
  });

  it('registers components with the same name safely', async () => {
    const files: TestComponentDetails[] = [
      {
        path: app('components/form/controls/inline.component.ts'),
        content: createControlComponent(
          'inline',
          inlineProviders,
          'InlineComponent',
        ),
        className: 'InlineComponent',
        key: 'inline',
      },
      {
        path: app('features/account/profile/controls/inline.component.ts'),
        content: createControlComponent(
          'inline',
          inlineProviders,
          'InlineComponent',
        ),
        className: 'InlineComponent',
        key: 'inline',
      },
    ];

    addComponentFiles(appTree, files);
    provideToken(appTree, appConfigPathRaw, registrationsPath);

    const tree = await runSchematic();

    const componentRegistrationsSf = parseTS(
      read(tree, src(registrationsPath)),
    );

    const controlsImportPath = buildRelativePath(
      src(registrationsPath),
      app('components/form/controls/inline.component.ts'),
    ).replace('.ts', '');

    const featureImportPath = buildRelativePath(
      src(registrationsPath),
      app('features/account/profile/controls/inline.component.ts'),
    ).replace('.ts', '');

    const controlImportCount = countNamedImport(
      componentRegistrationsSf,
      controlsImportPath,
      'InlineComponent',
    );

    const featureImportCount = countNamedImport(
      componentRegistrationsSf,
      featureImportPath,
      'InlineComponent',
    );

    const registrationsCount = countComponentRegistrationsMapProviderIdentifier(
      componentRegistrationsSf,
      'inline',
      'InlineComponent',
    );

    expect(controlImportCount).toBe(1);
    expect(featureImportCount).toBe(0);
    expect(registrationsCount).toBe(1);
  });

  it('does not duplicate registrations, if user already registered component under different key', async () => {
    const files: TestComponentDetails[] = [
      {
        path: app('components/form/controls/inline.component.ts'),
        content: createControlComponent(
          'inline',
          inlineProviders,
          'InlineComponent',
        ),
        className: 'InlineComponent',
        key: 'inline',
      },
    ];

    addComponentFiles(appTree, files);

    const controlsImportPath = buildRelativePath(
      src(registrationsPath),
      app('components/form/controls/inline.component.ts'),
    ).replace('.ts', '');

    provideToken(
      appTree,
      appConfigPathRaw,
      registrationsPath,
      '["some-key", InlineComponent]',
      `import { InlineComponent } from '${controlsImportPath}'`,
    );

    const tree = await runSchematic();

    const componentRegistrationsSf = parseTS(
      read(tree, src(registrationsPath)),
    );

    const controlImportCount = countNamedImport(
      componentRegistrationsSf,
      controlsImportPath,
      'InlineComponent',
    );

    const newRegistrationsCount =
      countComponentRegistrationsMapProviderIdentifier(
        componentRegistrationsSf,
        'inline',
        'InlineComponent',
      );

    const existingRegistrationsCount =
      countComponentRegistrationsMapProviderIdentifier(
        componentRegistrationsSf,
        'some-key',
        'InlineComponent',
      );

    expect(controlImportCount).toBe(1);
    expect(newRegistrationsCount).toBe(0);
    expect(existingRegistrationsCount).toBe(1);
  });

  it('uses schematics config file when passed as parameter', async () => {
    const files: TestComponentDetails[] = [
      {
        path: app('components/form/controls/inline.component.ts'),
        content: createControlComponent(
          'inline',
          inlineProviders,
          'InlineComponent',
        ),
        className: 'InlineComponent',
        key: 'inline',
      },
      {
        path: app('components/form/controls/helper.component.ts'),
        content: createControlComponent(
          'helper',
          helperProviders,
          'HelperComponent',
        ),
        className: 'HelperComponent',
        key: 'helper',
      },
      {
        path: app('components/form/controls/secret/secret.component.ts'),
        content: createControlComponent(
          'secret',
          helperProviders,
          'SecretComponent',
        ),
        className: 'SecretComponent',
        key: 'secret',
        shouldRegister: false,
      },
      {
        path: app('features/login/controls/password-input.component.ts'),
        content: createControlComponent(
          'profile-helper',
          helperProviders,
          'PasswordInputComponent',
        ),
        className: 'PasswordInputComponent',
        key: 'password-input',
        shouldRegister: false,
      },
    ];

    addComponentFiles(appTree, files);

    const schematicsConfig = 'configurations/formbar.config.json';
    const nonDefaultRegistrationsPath =
      'app/feature/survey/form/component-registrations.ts';

    const config: NgxFormbarAutomationConfig = {
      registrationType: 'config',
      controlRegistrationsPath: nonDefaultRegistrationsPath,
      discovery: {
        include: ['**/components/form/controls/**'],
        exclude: ['**/components/form/controls/secret/**'],
      },
    };
    writeJson(appTree, src(schematicsConfig), config);
    provideMap(
      appTree,
      appConfigPathRaw,
      nonDefaultRegistrationsPath,
      formbarConfigPath,
    );

    const tree = await runSchematic({
      schematicsConfig,
    });

    assertRegisteredComponents(
      tree,
      files,
      src(nonDefaultRegistrationsPath),
      directComponentRegistrationsHasIdentifier,
    );
  });

  it('finds schematics config file if no parameter was passed', async () => {
    const files: TestComponentDetails[] = [
      {
        path: app('components/form/controls/inline.component.ts'),
        content: createControlComponent(
          'inline',
          inlineProviders,
          'InlineComponent',
        ),
        className: 'InlineComponent',
        key: 'inline',
      },
      {
        path: app('components/form/controls/helper.component.ts'),
        content: createControlComponent(
          'helper',
          helperProviders,
          'HelperComponent',
        ),
        className: 'HelperComponent',
        key: 'helper',
      },
      {
        path: app('components/form/controls/secret/secret.component.ts'),
        content: createControlComponent(
          'secret',
          helperProviders,
          'SecretComponent',
        ),
        className: 'SecretComponent',
        key: 'secret',
        shouldRegister: false,
      },
      {
        path: app('features/login/controls/password-input.component.ts'),
        content: createControlComponent(
          'profile-helper',
          helperProviders,
          'PasswordInputComponent',
        ),
        className: 'PasswordInputComponent',
        key: 'password-input',
        shouldRegister: false,
      },
    ];

    addComponentFiles(appTree, files);
    const config: NgxFormbarAutomationConfig = {
      registrationType: 'config',
      discovery: {
        include: ['**/components/form/controls/**'],
        exclude: ['**/components/form/controls/secret/**'],
      },
    };

    writeJson(appTree, src(schematicsConfigPath), config);
    provideMap(appTree, appConfigPathRaw, registrationsPath, formbarConfigPath);

    const tree = await runSchematic();

    assertRegisteredComponents(
      tree,
      files,
      src(registrationsPath),
      directComponentRegistrationsHasIdentifier,
    );
  });
});

function assertRegisteredComponents(
  tree: UnitTestTree,
  files: TestComponentDetails[],
  registrationsPath: string,
  hasRegistrationFn: (
    sf: SourceFile,
    key: string,
    identifierName: string,
  ) => boolean,
) {
  const componentRegistrationsSf = parseTS(read(tree, registrationsPath));

  forEachAtLeastOnce(
    files,
    ({ path, className, key, shouldRegister = true }) => {
      const componentImportPath = buildRelativePath(
        registrationsPath,
        path,
      ).replace('.ts', '');

      const importsComponent = hasNamedImport(
        componentRegistrationsSf,
        componentImportPath,
        className,
      );
      const hasRegistration = hasRegistrationFn(
        componentRegistrationsSf,
        key,
        className,
      );
      const message = `${className} - ${key} - ${shouldRegister.toString()}`;
      expect(importsComponent, message).toBe(shouldRegister);
      expect(hasRegistration, message).toBe(shouldRegister);
    },
  );
}
