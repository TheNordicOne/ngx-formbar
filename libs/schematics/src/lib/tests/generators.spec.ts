import { beforeEach, describe, expect, it } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';

import { Schema as GenerateOptions } from '../shared/schema';
import {
  addHelperFile,
  addHelperIndexFile,
  addProject,
  COLLECTION_PATH,
  provideMap,
  provideMapInlineNoSplit,
  provideMapNoSplit,
  provideToken,
  provideTokenNoSplit,
  setComponentTypeConfig,
  setupWorkspace,
} from './workspace-setup';
import {
  app,
  appRoot,
  classDeclarationExists,
  classImplementsInterface,
  exists,
  hasDynamicImportOf,
  interfaceHasTypeLiteral,
  read,
  src,
  writeJson,
  writeTs,
  appConfigProvidersComponentRegistrationsMapHasIdentifier,
  componentRegistrationsMapProviderHasIdentifier,
  componentSelectorEquals,
  decoratorHasProp,
  decoratorPropInitializerIsIdentifier,
  defineFormbarConfigComponentRegistrationsHasIdentifier,
  directComponentRegistrationsHasIdentifier,
  hasNamedImport,
  importForSymbolUsesCorrectRelativePath,
  parseTS,
  provideFormbarComponentRegistrationsHasIdentifier,
} from './helper';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { NgxFormbarAutomationConfig } from '@ngx-formbar/setup';
import {
  DEFAULT_VIEW_PROVIDER_HELPER,
  REACTIVE_FORMS_PACKAGE_NAME,
} from '../shared/constants';

const appConfigPathRaw = 'app.config.ts';
const formbarConfigPath = 'app/formbar.config.ts';
const registrationsPath = 'app/registrations/component-registrations.ts';
const schematicsConfigPath = 'app/formbar-schematic.config.json';

describe('control schematic', () => {
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;

  const baseOptions: GenerateOptions = {
    project: 'test-app',
    key: 'test',
  };

  const viewProviderHelperPath = 'app/shared/helper';
  const viewProviderHelper =
    'control-container.view-provider.ts#controlContainterViewProviders';
  const viewProviderHelperPathOption = `${viewProviderHelperPath}/${viewProviderHelper}`;

  const defaultComponentOutputPath = app('test/test-control.ts');
  const groupComponentOutputPath = app('test/test-group.ts');
  const blockComponentOutputPath = app('test/test-block.ts');
  const arrayComponentOutputPath = app('test/test-array.ts');
  const appConfigPath = app(appConfigPathRaw);

  async function runSchematic(
    schematicName: 'control' | 'group' | 'block' | 'array',
    options: Partial<GenerateOptions> = {},
  ) {
    return runner.runSchematic(
      schematicName,
      { ...baseOptions, ...options },
      appTree,
    );
  }

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);
    appTree = await setupWorkspace(runner);
  });

  describe('generated file content', () => {
    beforeEach(() => {
      provideMapInlineNoSplit(appTree, appConfigPathRaw);
    });

    describe('view provider helper', () => {
      it('imports view providers from barrel export using default file name and identifier', async () => {
        addHelperIndexFile(appTree, viewProviderHelperPath);
        const tree = await runSchematic('control', {
          viewProviderHelperPath,
        });

        const parts = DEFAULT_VIEW_PROVIDER_HELPER.split('#');
        const identifier = parts[1];
        const sf = parseTS(read(tree, defaultComponentOutputPath));

        const viewProviderImportPath = buildRelativePath(
          defaultComponentOutputPath,
          src(viewProviderHelperPath),
        );

        const importsViewProviderHelper = hasNamedImport(
          sf,
          viewProviderImportPath,
          identifier,
        );

        const importsControlContainerFromAngular = hasNamedImport(
          sf,
          '@angular/forms',
          'ControlContainer',
        );

        const hasViewProviderInDecorator = decoratorPropInitializerIsIdentifier(
          sf,
          'Component',
          'viewProviders',
          identifier,
        );

        expect(importsViewProviderHelper).toBe(true);
        expect(importsControlContainerFromAngular).toBe(false);
        expect(hasViewProviderInDecorator).toBe(true);
      });

      it('imports view providers from file using default file name and identifier', async () => {
        addHelperFile(
          appTree,
          `${viewProviderHelperPath}/view-provider.ts`,
          'viewProviders',
        );
        const tree = await runSchematic('control', {
          viewProviderHelperPath,
        });

        const parts = DEFAULT_VIEW_PROVIDER_HELPER.split('#');
        const fileName = parts[0].replace('.ts', '');
        const identifier = parts[1];
        const sf = parseTS(read(tree, defaultComponentOutputPath));

        const viewProviderImportPath = buildRelativePath(
          defaultComponentOutputPath,
          src(`${viewProviderHelperPath}/${fileName}`),
        );

        const importsViewProviderHelper = hasNamedImport(
          sf,
          viewProviderImportPath,
          identifier,
        );

        const importsControlContainerFromAngular = hasNamedImport(
          sf,
          '@angular/forms',
          'ControlContainer',
        );

        const hasViewProviderInDecorator = decoratorPropInitializerIsIdentifier(
          sf,
          'Component',
          'viewProviders',
          identifier,
        );

        expect(importsViewProviderHelper).toBe(true);
        expect(importsControlContainerFromAngular).toBe(false);
        expect(hasViewProviderInDecorator).toBe(true);
      });

      it('imports view providers from barrel export using identifier from option', async () => {
        addHelperIndexFile(appTree, viewProviderHelperPath);
        const tree = await runSchematic('control', {
          viewProviderHelperPath: viewProviderHelperPathOption,
        });

        const parts = viewProviderHelper.split('#');
        const identifier = parts[1];
        const sf = parseTS(read(tree, defaultComponentOutputPath));

        const viewProviderImportPath = buildRelativePath(
          defaultComponentOutputPath,
          src(viewProviderHelperPath),
        );

        const importsViewProviderHelper = hasNamedImport(
          sf,
          viewProviderImportPath,
          identifier,
        );

        const importsControlContainerFromAngular = hasNamedImport(
          sf,
          '@angular/forms',
          'ControlContainer',
        );

        const hasViewProviderInDecorator = decoratorPropInitializerIsIdentifier(
          sf,
          'Component',
          'viewProviders',
          identifier,
        );

        expect(importsViewProviderHelper).toBe(true);
        expect(importsControlContainerFromAngular).toBe(false);
        expect(hasViewProviderInDecorator).toBe(true);
      });

      it('imports view providers from barrel export using file name from option and default identifier', async () => {
        addHelperIndexFile(appTree, viewProviderHelperPath);
        const tree = await runSchematic('control', {
          viewProviderHelperPath: `${viewProviderHelperPath}/control-container.view-provider.ts`,
        });

        const parts = DEFAULT_VIEW_PROVIDER_HELPER.split('#');
        const identifier = parts[1];
        const sf = parseTS(read(tree, defaultComponentOutputPath));

        const viewProviderImportPath = buildRelativePath(
          defaultComponentOutputPath,
          src(viewProviderHelperPath),
        );

        const importsViewProviderHelper = hasNamedImport(
          sf,
          viewProviderImportPath,
          identifier,
        );

        const importsControlContainerFromAngular = hasNamedImport(
          sf,
          '@angular/forms',
          'ControlContainer',
        );

        const hasViewProviderInDecorator = decoratorPropInitializerIsIdentifier(
          sf,
          'Component',
          'viewProviders',
          identifier,
        );

        expect(importsViewProviderHelper).toBe(true);
        expect(importsControlContainerFromAngular).toBe(false);
        expect(hasViewProviderInDecorator).toBe(true);
      });

      it('imports view providers from file using file name from option and default identifier', async () => {
        addHelperFile(
          appTree,
          `${viewProviderHelperPath}/control-container.view-provider.ts`,
          'controlContainterViewProviders',
        );
        const tree = await runSchematic('control', {
          viewProviderHelperPath: viewProviderHelperPathOption,
        });

        const parts = viewProviderHelper.split('#');
        const fileName = parts[0].replace('.ts', '');
        const identifier = parts[1];
        const sf = parseTS(read(tree, defaultComponentOutputPath));

        const viewProviderImportPath = buildRelativePath(
          defaultComponentOutputPath,
          src(`${viewProviderHelperPath}/${fileName}`),
        );

        const importsViewProviderHelper = hasNamedImport(
          sf,
          viewProviderImportPath,
          identifier,
        );

        const importsControlContainerFromAngular = hasNamedImport(
          sf,
          '@angular/forms',
          'ControlContainer',
        );

        const hasViewProviderInDecorator = decoratorPropInitializerIsIdentifier(
          sf,
          'Component',
          'viewProviders',
          identifier,
        );

        expect(importsViewProviderHelper).toBe(true);
        expect(importsControlContainerFromAngular).toBe(false);
        expect(hasViewProviderInDecorator).toBe(true);
      });

      it('falls back to inline view providers when the helper file does not exist', async () => {
        const tree = await runSchematic('control', {
          viewProviderHelperPath: 'app/does/not/exist',
        });

        const sf = parseTS(read(tree, defaultComponentOutputPath));

        expect(
          hasNamedImport(
            sf,
            '../does/not/exist/view-provider',
            'viewProviders',
          ),
        ).toBe(false);
        expect(hasNamedImport(sf, '@angular/forms', 'ControlContainer')).toBe(
          true,
        );
        expect(decoratorHasProp(sf, 'Component', 'viewProviders')).toBe(true);
      });
    });

    describe('view provider helper path', () => {
      it.each([
        ['includes the source root', src(viewProviderHelperPath).slice(1)],
        [
          'includes the source root after "./"',
          `.${src(viewProviderHelperPath)}`,
        ],
        ['starts with a slash', src(viewProviderHelperPath)],
      ])('resolves a path that %s', async (_, helperPath) => {
        addHelperFile(
          appTree,
          `${viewProviderHelperPath}/view-provider.ts`,
          'viewProviders',
        );
        const tree = await runSchematic('control', {
          viewProviderHelperPath: helperPath,
        });

        const sf = parseTS(read(tree, defaultComponentOutputPath));

        expect(
          hasNamedImport(sf, '../shared/helper/view-provider', 'viewProviders'),
        ).toBe(true);
      });

      it('resolves a path that only shares a prefix with the source root under the source root', async () => {
        addProject(appTree, 'src-app', '', 'src');
        writeTs(
          appTree,
          '/src/srcShared/helper/view-provider.ts',
          'export const viewProviders = [];',
        );

        const tree = await runSchematic('control', {
          project: 'src-app',
          path: 'src/app',
          viewProviderHelperPath: 'srcShared/helper',
        });

        const sf = parseTS(read(tree, '/src/app/test/test-control.ts'));

        expect(
          hasNamedImport(
            sf,
            '../../srcShared/helper/view-provider',
            'viewProviders',
          ),
        ).toBe(true);
      });
    });

    describe('interface-based control output', () => {
      it('falls back to inline view providers and emits no hostDirectives', async () => {
        const tree = await runSchematic('control');
        const sf = parseTS(read(tree, defaultComponentOutputPath));

        const importsControlContainerFromAngular = hasNamedImport(
          sf,
          '@angular/forms',
          'ControlContainer',
        );

        const hasViewProvidersInDecorator = decoratorHasProp(
          sf,
          'Component',
          'viewProviders',
        );

        const hasHostDirectivesInDecorator = decoratorHasProp(
          sf,
          'Component',
          'hostDirectives',
        );

        expect(importsControlContainerFromAngular).toBe(true);
        expect(hasViewProvidersInDecorator).toBe(true);
        expect(hasHostDirectivesInDecorator).toBe(false);
      });

      it('control implements ReactiveFormbarControl with signal inputs', async () => {
        const tree = await runSchematic('control');
        const sf = parseTS(read(tree, defaultComponentOutputPath));

        const implementsControl = classImplementsInterface(
          sf,
          'TestControl',
          'ReactiveFormbarControl',
        );

        const importsReactiveFormbarControl = hasNamedImport(
          sf,
          REACTIVE_FORMS_PACKAGE_NAME,
          'ReactiveFormbarControl',
        );

        const importsInputFromCore = hasNamedImport(
          sf,
          '@angular/core',
          'input',
        );

        expect(implementsControl).toBe(true);
        expect(importsReactiveFormbarControl).toBe(true);
        expect(importsInputFromCore).toBe(true);
      });

      it('group implements ReactiveFormbarGroup and imports NgxFbControlOutlet', async () => {
        const tree = await runSchematic('group');
        const sf = parseTS(read(tree, groupComponentOutputPath));

        const implementsGroup = classImplementsInterface(
          sf,
          'TestGroup',
          'ReactiveFormbarGroup',
        );

        const importsReactiveFormbarGroup = hasNamedImport(
          sf,
          REACTIVE_FORMS_PACKAGE_NAME,
          'ReactiveFormbarGroup',
        );

        const importsControlOutlet = hasNamedImport(
          sf,
          REACTIVE_FORMS_PACKAGE_NAME,
          'NgxFbControlOutlet',
        );

        const hasHostDirectivesInDecorator = decoratorHasProp(
          sf,
          'Component',
          'hostDirectives',
        );

        expect(implementsGroup).toBe(true);
        expect(importsReactiveFormbarGroup).toBe(true);
        expect(importsControlOutlet).toBe(true);
        expect(hasHostDirectivesInDecorator).toBe(false);
      });

      it('group template uses ngxfb-control-outlet', async () => {
        const tree = await runSchematic('group');
        const html = read(tree, app('test/test-group.html'));
        expect(html).toContain('<ngxfb-control-outlet');
      });

      it('array implements ReactiveFormbarArray and imports the array outlet and context token', async () => {
        const tree = await runSchematic('array');
        const sf = parseTS(read(tree, arrayComponentOutputPath));

        const implementsArray = classImplementsInterface(
          sf,
          'TestArray',
          'ReactiveFormbarArray',
        );

        const importsReactiveFormbarArray = hasNamedImport(
          sf,
          REACTIVE_FORMS_PACKAGE_NAME,
          'ReactiveFormbarArray',
        );

        const importsArrayOutlet = hasNamedImport(
          sf,
          REACTIVE_FORMS_PACKAGE_NAME,
          'NgxFbFormArrayOutlet',
        );

        const importsArrayContextToken = hasNamedImport(
          sf,
          REACTIVE_FORMS_PACKAGE_NAME,
          'NGXFB_ARRAY_CONTROL',
        );

        const hasHostDirectivesInDecorator = decoratorHasProp(
          sf,
          'Component',
          'hostDirectives',
        );

        expect(implementsArray).toBe(true);
        expect(importsReactiveFormbarArray).toBe(true);
        expect(importsArrayOutlet).toBe(true);
        expect(importsArrayContextToken).toBe(true);
        expect(hasHostDirectivesInDecorator).toBe(false);
      });

      it('array falls back to inline view providers', async () => {
        const tree = await runSchematic('array');
        const sf = parseTS(read(tree, arrayComponentOutputPath));

        const importsControlContainerFromAngular = hasNamedImport(
          sf,
          '@angular/forms',
          'ControlContainer',
        );

        const hasViewProvidersInDecorator = decoratorHasProp(
          sf,
          'Component',
          'viewProviders',
        );

        expect(importsControlContainerFromAngular).toBe(true);
        expect(hasViewProvidersInDecorator).toBe(true);
      });

      it('array template renders rows through the form array outlet', async () => {
        const tree = await runSchematic('array');
        const html = read(tree, app('test/test-array.html'));
        expect(html).toContain('[formArrayName]="name()"');
        expect(html).toContain('<ngxfb-form-array-outlet [index]="$index"');
      });

      it('block implements FormbarBlock with no viewProviders or hostDirectives', async () => {
        const tree = await runSchematic('block');
        const sf = parseTS(read(tree, blockComponentOutputPath));

        const implementsBlock = classImplementsInterface(
          sf,
          'TestBlock',
          'FormbarBlock',
        );

        const importsFormbarBlock = hasNamedImport(
          sf,
          REACTIVE_FORMS_PACKAGE_NAME,
          'FormbarBlock',
        );

        const hasViewProviders = decoratorHasProp(
          sf,
          'Component',
          'viewProviders',
        );

        const hasHostDirectives = decoratorHasProp(
          sf,
          'Component',
          'hostDirectives',
        );

        expect(implementsBlock).toBe(true);
        expect(importsFormbarBlock).toBe(true);
        expect(hasViewProviders).toBe(false);
        expect(hasHostDirectives).toBe(false);
      });

      it('defaults the control suffix to "Control"', async () => {
        const tree = await runSchematic('control');
        expect(exists(tree, app('test/test-control.ts'))).toBe(true);
      });

      it('defaults the group suffix to "Group"', async () => {
        const tree = await runSchematic('group');
        expect(exists(tree, app('test/test-group.ts'))).toBe(true);
      });

      it('defaults the block suffix to "Block"', async () => {
        const tree = await runSchematic('block');
        expect(exists(tree, app('test/test-block.ts'))).toBe(true);
      });

      it('defaults the array suffix to "Array"', async () => {
        const tree = await runSchematic('array');
        expect(exists(tree, app('test/test-array.ts'))).toBe(true);
      });

      it('array interface extends NgxFbArray with the key as type', async () => {
        const tree = await runSchematic('array');
        const typeSf = parseTS(read(tree, app('test/test-array-config.ts')));
        expect(interfaceHasTypeLiteral(typeSf, 'TestArrayConfig', 'test')).toBe(
          true,
        );
        expect(read(tree, app('test/test-array-config.ts'))).toMatch(
          /interface TestArrayConfig<T[^>]*> extends NgxFbArray<T>/,
        );
      });

      it('group interface extends NgxFbFormGroup with the key as type', async () => {
        const tree = await runSchematic('group');
        const typeSf = parseTS(read(tree, app('test/test-group-config.ts')));
        expect(interfaceHasTypeLiteral(typeSf, 'TestGroupConfig', 'test')).toBe(
          true,
        );
        expect(read(tree, app('test/test-group-config.ts'))).toMatch(
          /interface TestGroupConfig<T[^>]*> extends NgxFbFormGroup<T>/,
        );
      });
    });

    describe('component and interface file naming', () => {
      it('defaults to no component file suffix and a Config interface in its own file', async () => {
        const tree = await runSchematic('control');

        expect(exists(tree, app('test/test-control.ts'))).toBe(true);
        expect(exists(tree, app('test/test-control-config.ts'))).toBe(true);

        const componentSf = parseTS(read(tree, app('test/test-control.ts')));
        const hasBareClass = classDeclarationExists(componentSf, 'TestControl');
        const importsConfigWithCorrectPath =
          importForSymbolUsesCorrectRelativePath(
            componentSf,
            app('test/test-control.ts'),
            'TestControlConfig',
            app('test/test-control-config.ts'),
          );

        const typeSf = parseTS(read(tree, app('test/test-control-config.ts')));
        const interfaceHasType = interfaceHasTypeLiteral(
          typeSf,
          'TestControlConfig',
          'test',
        );

        expect(hasBareClass).toBe(true);
        expect(importsConfigWithCorrectPath).toBe(true);
        expect(interfaceHasType).toBe(true);
      });

      it('applies the Angular component type to the file and class and uses ".type" for the interface file', async () => {
        setComponentTypeConfig(appTree, { type: 'component' });
        const tree = await runSchematic('control');

        expect(exists(tree, app('test/test-control.component.ts'))).toBe(true);
        expect(exists(tree, app('test/test-control.component.html'))).toBe(
          true,
        );
        expect(exists(tree, app('test/test-control-config.type.ts'))).toBe(
          true,
        );

        const componentSf = parseTS(
          read(tree, app('test/test-control.component.ts')),
        );
        expect(
          classDeclarationExists(componentSf, 'TestControlComponent'),
        ).toBe(true);
      });

      it('reads the Angular component type from the workspace level', async () => {
        setComponentTypeConfig(appTree, { type: 'component' }, 'workspace');
        const tree = await runSchematic('control');

        expect(exists(tree, app('test/test-control.component.ts'))).toBe(true);
        expect(exists(tree, app('test/test-control-config.type.ts'))).toBe(
          true,
        );
      });

      it('keeps the class bare when addTypeToClassName is false', async () => {
        setComponentTypeConfig(appTree, {
          type: 'component',
          addTypeToClassName: false,
        });
        const tree = await runSchematic('control');

        const componentSf = parseTS(
          read(tree, app('test/test-control.component.ts')),
        );
        expect(classDeclarationExists(componentSf, 'TestControl')).toBe(true);
        expect(
          classDeclarationExists(componentSf, 'TestControlComponent'),
        ).toBe(false);
      });

      it('applies an explicit interfaceFileSuffix even without a component suffix', async () => {
        const tree = await runSchematic('control', {
          interfaceFileSuffix: 'model',
        });

        expect(exists(tree, app('test/test-control-config.model.ts'))).toBe(
          true,
        );
        expect(exists(tree, app('test/test-control-config.ts'))).toBe(false);
      });
    });
  });

  describe('without configuration', () => {
    it.each(['control', 'group', 'block', 'array'] as const)(
      'registers the %s through the registrationType and controlRegistrationsPath options',
      async (schematic) => {
        const customRegistrations = 'app/forms/component-registrations.ts';
        provideMap(
          appTree,
          appConfigPathRaw,
          customRegistrations,
          formbarConfigPath,
        );

        const tree = await runSchematic(schematic, {
          key: 'slider',
          registrationType: 'config',
          controlRegistrationsPath: customRegistrations,
        });

        expect(read(tree, src(customRegistrations))).toContain(
          `"slider": loadComponent(() => import("../slider/slider-${schematic}")`,
        );
      },
    );

    it.each([
      'projects/test-app/src/app/forms/component-registrations.ts',
      '/projects/test-app/src/app/forms/component-registrations.ts',
    ])(
      'registers into a controlRegistrationsPath of %s as given',
      async (controlRegistrationsPath) => {
        const customRegistrations = 'app/forms/component-registrations.ts';
        provideMap(
          appTree,
          appConfigPathRaw,
          customRegistrations,
          formbarConfigPath,
        );

        const tree = await runSchematic('control', {
          key: 'slider',
          registrationType: 'config',
          controlRegistrationsPath,
        });

        expect(read(tree, src(customRegistrations))).toContain(
          `"slider": loadComponent(() => import("../slider/slider-control")`,
        );
      },
    );

    it('creates a control with passed values (name, key, path, suffixes)', async () => {
      provideMapInlineNoSplit(appTree, appConfigPathRaw);
      const options: GenerateOptions = {
        project: 'test-app',
        name: 'profile',
        key: 'user',
        path: 'app/features/account',
        interfaceSuffix: 'Field',
        componentSuffix: 'Widget',
      };

      const tree = await runSchematic('control', options);

      const baseDir = app('features/account/profile');
      const componentFilePath = `${baseDir}/profile-widget.ts`;

      const typeFilePath = `${baseDir}/profile-field.ts`;

      const componentSf = parseTS(read(tree, componentFilePath));
      const typeSf = parseTS(read(tree, typeFilePath));

      const hasClass = classDeclarationExists(componentSf, 'ProfileWidget');
      const hasSelector = componentSelectorEquals(
        componentSf,
        'app-profile-widget',
      );

      const importsInterfaceWithCorrectPath =
        importForSymbolUsesCorrectRelativePath(
          componentSf,
          componentFilePath,
          'ProfileField',
          typeFilePath,
        );

      const interfaceHasType = interfaceHasTypeLiteral(
        typeSf,
        'ProfileField',
        'user',
      );

      expect(hasClass).toBe(true);
      expect(hasSelector).toBe(true);
      expect(importsInterfaceWithCorrectPath).toBe(true);
      expect(interfaceHasType).toBe(true);
    });

    it('registers the created control with the token provider if registrations are split', async () => {
      provideToken(appTree, appConfigPathRaw, registrationsPath);
      const tree = await runSchematic('control');
      const componentRegistrationsSf = parseTS(
        read(tree, src(registrationsPath)),
      );

      const importsComponent = hasDynamicImportOf(
        componentRegistrationsSf,
        'TestControl',
      );

      const hasRegistration = componentRegistrationsMapProviderHasIdentifier(
        componentRegistrationsSf,
        'test',
        'TestControl',
      );

      expect(importsComponent).toBe(true);
      expect(hasRegistration).toBe(true);
    });

    it('registers a camelCase key from the dasherized directory it is written to', async () => {
      provideToken(appTree, appConfigPathRaw, registrationsPath);
      const tree = await runSchematic('control', { key: 'phoneNumber' });

      expect(read(tree, src(registrationsPath))).toContain(
        'import("../phone-number/phone-number-control")',
      );
    });

    it('writes to a camelCase path as given and registers from there', async () => {
      provideToken(appTree, appConfigPathRaw, registrationsPath);
      const tree = await runSchematic('control', {
        key: 'phone',
        path: 'app/myForms',
      });

      expect(exists(tree, app('myForms/phone/phone-control.ts'))).toBe(true);
      expect(read(tree, src(registrationsPath))).toContain(
        'import("../myForms/phone/phone-control")',
      );
    });

    it.each([
      ['unset', undefined, app('slider/slider-control.ts')],
      [
        'inside the source root',
        'projects/test-app/src/forms',
        src('forms/slider/slider-control.ts'),
      ],
      [
        'inside the project root but outside the source root',
        'projects/test-app/e2e',
        appRoot('e2e/slider/slider-control.ts'),
      ],
      [
        'workspace-absolute',
        '/projects/test-app/e2e',
        appRoot('e2e/slider/slider-control.ts'),
      ],
      ['outside the project', 'forms', src('forms/slider/slider-control.ts')],
      [
        'sharing only a prefix with the project root',
        'projects/test-app-legacy',
        src('projects/test-app-legacy/slider/slider-control.ts'),
      ],
    ])('writes a --path that is %s', async (_, path, file) => {
      const tree = await runSchematic('control', { key: 'slider', path });

      expect(exists(tree, file)).toBe(true);
    });

    it.each([
      [undefined, '/src/app/slider/slider-control.ts'],
      ['srcLegacy', '/srcLegacy/slider/slider-control.ts'],
      ['src/forms', '/src/forms/slider/slider-control.ts'],
      ['src', '/src/slider/slider-control.ts'],
      ['app/forms', '/app/forms/slider/slider-control.ts'],
    ])(
      'writes --path %s relative to the workspace in a project rooted there',
      async (path, file) => {
        addProject(appTree, 'src-app', '', 'src');

        const tree = await runSchematic('control', {
          key: 'slider',
          path,
          project: 'src-app',
        });

        expect(exists(tree, file)).toBe(true);
      },
    );

    it.each([
      ['a trailing "/"', 'projects/a/', 'projects/a/src/'],
      ['a leading "./"', './projects/a', './projects/a/src'],
    ])(
      'reads --path the same with the roots spelled with %s',
      async (_, root, sourceRoot) => {
        addProject(appTree, 'a', root, sourceRoot);

        const inProject = await runSchematic('control', {
          key: 'slider',
          path: 'projects/a/forms',
          project: 'a',
        });

        expect(
          exists(inProject, '/projects/a/forms/slider/slider-control.ts'),
        ).toBe(true);

        const inSourceRoot = await runSchematic('control', {
          key: 'slider',
          path: 'projects/a/src/forms',
          project: 'a',
        });

        expect(
          exists(
            inSourceRoot,
            '/projects/a/src/forms/slider/slider-control.ts',
          ),
        ).toBe(true);
      },
    );

    it('uses a --path with a leading "/" as given, also outside the project', async () => {
      const tree = await runSchematic('control', {
        key: 'slider',
        path: '/shared/forms',
      });

      expect(exists(tree, '/shared/forms/slider/slider-control.ts')).toBe(true);
      expect(exists(tree, src('shared/forms/slider/slider-control.ts'))).toBe(
        false,
      );
    });

    it('still reads a --path without a leading "/" outside the project under the source root', async () => {
      const tree = await runSchematic('control', {
        key: 'slider',
        path: 'shared/forms',
      });

      expect(exists(tree, src('shared/forms/slider/slider-control.ts'))).toBe(
        true,
      );
    });

    it.each([
      ['a sibling project', '/projects/other/src/forms'],
      ['the source root of a sibling project', '/libs/other-source'],
    ])('fails on a --path with a leading "/" inside %s', async (_, path) => {
      addProject(appTree, 'other', 'projects/other', 'libs/other-source');

      await expect(
        runSchematic('control', { key: 'slider', path }),
      ).rejects.toThrow(`"path" lies inside another project: ${path}`);
    });

    it('fails on a bare --path inside a sibling project', async () => {
      addProject(
        appTree,
        'other-app',
        'projects/other-app',
        'projects/other-app/src',
      );

      await expect(
        runSchematic('control', {
          key: 'slider',
          path: 'projects/other-app/forms',
        }),
      ).rejects.toThrow(
        '"path" lies inside another project: projects/other-app/forms',
      );
    });

    it('fails on a --path with a leading "/" inside a project nested in the project', async () => {
      addProject(appTree, 'src-app', '', 'src');

      await expect(
        runSchematic('control', {
          key: 'slider',
          path: '/projects/test-app/src/app',
          project: 'src-app',
        }),
      ).rejects.toThrow(
        '"path" lies inside another project: /projects/test-app/src/app',
      );
    });

    it('does not count a project rooted at the workspace as containing a --path with a leading "/"', async () => {
      addProject(appTree, 'src-app', '', 'src');

      const tree = await runSchematic('control', {
        key: 'slider',
        path: '/shared/forms',
      });

      expect(exists(tree, '/shared/forms/slider/slider-control.ts')).toBe(true);
    });

    it('fails on a bare --path inside a project nested in a project rooted at the workspace', async () => {
      addProject(appTree, 'src-app', '', 'src');

      await expect(
        runSchematic('control', {
          key: 'slider',
          path: 'projects/test-app/src/app',
          project: 'src-app',
        }),
      ).rejects.toThrow(
        '"path" lies inside another project: projects/test-app/src/app',
      );
    });

    it('reads the configured path relative to the source root', async () => {
      addProject(appTree, 'src-app', '', 'src');
      writeJson(appTree, '/src/app/formbar-schematic.config.json', {
        control: { path: 'app/forms' },
      });

      const tree = await runSchematic('control', {
        key: 'slider',
        path: 'elsewhere',
        project: 'src-app',
      });

      expect(exists(tree, '/src/app/forms/slider/slider-control.ts')).toBe(
        true,
      );
    });

    it('registers the created control with the token provider if registrations are not split', async () => {
      provideTokenNoSplit(appTree, appConfigPathRaw);
      const tree = await runSchematic('control');
      const appConfigSf = parseTS(read(tree, appConfigPath));

      const importsComponent = hasDynamicImportOf(appConfigSf, 'TestControl');

      const hasRegistration =
        appConfigProvidersComponentRegistrationsMapHasIdentifier(
          appConfigSf,
          'test',
          'TestControl',
        );

      expect(importsComponent).toBe(true);
      expect(hasRegistration).toBe(true);
    });
  });

  describe('with a configuration file', () => {
    it('creates a control with values from configuration', async () => {
      const config: NgxFormbarAutomationConfig = {
        control: {
          interfaceSuffix: 'Field',
          componentSuffix: 'Widget',
        },
      };
      writeJson(appTree, src(schematicsConfigPath), config);
      provideMapInlineNoSplit(appTree, appConfigPathRaw);

      const tree = await runSchematic('control', {
        key: 'user',
        name: 'profile',
        path: 'app/features/account',
        schematicsConfig: schematicsConfigPath,
      });

      const baseDir = app('features/account/profile');
      const componentFilePath = `${baseDir}/profile-widget.ts`;
      const typeFilePath = `${baseDir}/profile-field.ts`;

      const componentSf = parseTS(read(tree, componentFilePath));
      const typeSf = parseTS(read(tree, typeFilePath));

      const hasClass = classDeclarationExists(componentSf, 'ProfileWidget');
      const hasSelector = componentSelectorEquals(
        componentSf,
        'app-profile-widget',
      );

      const interfaceHasType = interfaceHasTypeLiteral(
        typeSf,
        'ProfileField',
        'user',
      );

      expect(hasClass).toBe(true);
      expect(hasSelector).toBe(true);
      expect(interfaceHasType).toBe(true);
    });

    it('registers the created control to default location', async () => {
      const config: NgxFormbarAutomationConfig = {
        control: {
          interfaceSuffix: 'Field',
          componentSuffix: 'Control',
        },
      };
      writeJson(appTree, src(schematicsConfigPath), config);
      provideToken(appTree, appConfigPathRaw, registrationsPath);

      const tree = await runSchematic('control', {
        key: 'user',
        name: 'email',
        schematicsConfig: schematicsConfigPath,
      });

      const componentRegistrationsSf = parseTS(
        read(tree, src(registrationsPath)),
      );

      const importsComponent = hasDynamicImportOf(
        componentRegistrationsSf,
        'EmailControl',
      );

      const hasRegistration = componentRegistrationsMapProviderHasIdentifier(
        componentRegistrationsSf,
        'user',
        'EmailControl',
      );

      expect(importsComponent).toBe(true);
      expect(hasRegistration).toBe(true);
    });

    it('registers the created control to configured location', async () => {
      provideToken(appTree, appConfigPathRaw, registrationsPath);

      const config: NgxFormbarAutomationConfig = {
        control: {
          interfaceSuffix: 'Field',
          componentSuffix: 'Control',
        },
        controlRegistrationsPath: registrationsPath,
        registrationType: 'token',
      };
      writeJson(appTree, src(schematicsConfigPath), config);

      const tree = await runSchematic('control', {
        key: 'email',
        name: 'email',
        schematicsConfig: schematicsConfigPath,
      });

      const registrationsSf = parseTS(read(tree, src(registrationsPath)));

      const importsComponent = hasDynamicImportOf(
        registrationsSf,
        'EmailControl',
      );

      const hasRegistration = componentRegistrationsMapProviderHasIdentifier(
        registrationsSf,
        'email',
        'EmailControl',
      );

      expect(importsComponent).toBe(true);
      expect(hasRegistration).toBe(true);
    });

    it('does not register the created control if skipRegistration is set to true', async () => {
      const config: NgxFormbarAutomationConfig = {
        control: {
          skipRegistration: true,
        },
      };
      writeJson(appTree, src(schematicsConfigPath), config);
      provideToken(appTree, appConfigPathRaw, registrationsPath);

      const tree = await runSchematic('control', {
        key: 'email',
        name: 'email',
        schematicsConfig: schematicsConfigPath,
      });

      const registrationsSf = parseTS(read(tree, src(registrationsPath)));

      const importsComponent = hasDynamicImportOf(
        registrationsSf,
        'EmailControl',
      );

      const hasRegistration = provideFormbarComponentRegistrationsHasIdentifier(
        registrationsSf,
        'email',
        'EmailControl',
      );

      expect(importsComponent).toBe(false);
      expect(hasRegistration).toBe(false);
    });

    it('skips registration if control registrations file is not found', async () => {
      const config: NgxFormbarAutomationConfig = {
        control: {
          interfaceSuffix: 'Field',
          componentSuffix: 'Control',
        },
        controlRegistrationsPath: 'shared/forms/non-existent-registrations.ts',
      };
      writeJson(appTree, src(schematicsConfigPath), config);
      provideToken(appTree, appConfigPathRaw, registrationsPath);

      const tree = await runSchematic('control', {
        key: 'email',
        name: 'email',
        schematicsConfig: schematicsConfigPath,
      });

      const componentPath = app('email/email-control.ts');
      expect(exists(tree, componentPath)).toBe(true);

      expect(
        exists(tree, app('shared/forms/non-existent-registrations.ts')),
      ).toBe(false);
    });

    describe('registration style: map', () => {
      beforeEach(() => {
        const config: NgxFormbarAutomationConfig = {
          registrationType: 'config',
        };
        writeJson(appTree, src(schematicsConfigPath), config);
      });

      it('registers the created control in app.config.ts in provideFormbar', async () => {
        provideMapInlineNoSplit(appTree, appConfigPathRaw);
        const tree = await runSchematic('control');
        const appConfigSf = parseTS(read(tree, appConfigPath));

        const importsComponent = hasDynamicImportOf(appConfigSf, 'TestControl');

        const hasRegistration =
          provideFormbarComponentRegistrationsHasIdentifier(
            appConfigSf,
            'test',
            'TestControl',
          );

        expect(importsComponent).toBe(true);
        expect(hasRegistration).toBe(true);
      });

      it('registers the created control directly in the registrations config if registrations are not split', async () => {
        provideMapNoSplit(appTree, appConfigPathRaw, formbarConfigPath);
        const tree = await runSchematic('control');
        const formbarConfigSf = parseTS(read(tree, src(formbarConfigPath)));

        const importsComponent = hasDynamicImportOf(
          formbarConfigSf,
          'TestControl',
        );

        const hasRegistration =
          defineFormbarConfigComponentRegistrationsHasIdentifier(
            formbarConfigSf,
            'test',
            'TestControl',
          );

        expect(importsComponent).toBe(true);
        expect(hasRegistration).toBe(true);
      });

      it('registers the created control in the registrations if registrations are split', async () => {
        provideMap(
          appTree,
          appConfigPathRaw,
          registrationsPath,
          formbarConfigPath,
        );
        const tree = await runSchematic('control');
        const registrationsSf = parseTS(read(tree, src(registrationsPath)));

        const importsComponent = hasDynamicImportOf(
          registrationsSf,
          'TestControl',
        );

        const hasRegistration = directComponentRegistrationsHasIdentifier(
          registrationsSf,
          'test',
          'TestControl',
        );

        expect(importsComponent).toBe(true);
        expect(hasRegistration).toBe(true);
      });

      it('does not register the created control if skipRegistration is set to true', async () => {
        const config: NgxFormbarAutomationConfig = {
          control: {
            skipRegistration: true,
          },
          registrationType: 'config',
        };
        writeJson(appTree, src(schematicsConfigPath), config);
        provideMap(
          appTree,
          appConfigPathRaw,
          registrationsPath,
          formbarConfigPath,
        );

        const tree = await runSchematic('control', {
          key: 'email',
          name: 'email',
          schematicsConfig: schematicsConfigPath,
        });

        const formbarConfigSf = parseTS(read(tree, src(formbarConfigPath)));

        const importsComponent = hasDynamicImportOf(
          formbarConfigSf,
          'EmailControl',
        );

        const hasRegistration =
          provideFormbarComponentRegistrationsHasIdentifier(
            formbarConfigSf,
            'email',
            'EmailControl',
          );

        expect(importsComponent).toBe(false);
        expect(hasRegistration).toBe(false);
      });

      it('skips registration if control registrations file is not found', async () => {
        const config: NgxFormbarAutomationConfig = {
          control: {
            interfaceSuffix: 'Field',
            componentSuffix: 'Control',
          },
          controlRegistrationsPath:
            'shared/forms/non-existent-registrations.ts',
          registrationType: 'config',
        };
        writeJson(appTree, src(schematicsConfigPath), config);
        provideMapInlineNoSplit(appTree, appConfigPathRaw);

        const tree = await runSchematic('control', {
          key: 'email',
          name: 'email',
          schematicsConfig: schematicsConfigPath,
        });

        const componentPath = app('email/email-control.ts');
        expect(exists(tree, componentPath)).toBe(true);

        expect(
          exists(tree, app('shared/forms/non-existent-registrations.ts')),
        ).toBe(false);
      });
    });
  });
});

describe('scaffold warnings', () => {
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;
  let warnings: string[];

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);
    appTree = await setupWorkspace(runner);
    provideMapInlineNoSplit(appTree, appConfigPathRaw);
    warnings = [];
    runner.logger.subscribe((entry) => {
      if (entry.level === 'warn') {
        warnings.push(entry.message);
      }
    });
  });

  function scaffold(
    schematicName: 'control' | 'group' | 'block' | 'array',
    options: Partial<GenerateOptions> = {},
  ) {
    return runner.runSchematic(
      schematicName,
      { project: 'test-app', key: 'test', ...options },
      appTree,
    );
  }

  it.each<'token' | 'config'>(['token', 'config'])(
    'names the resolved path when the %s registrations file does not exist',
    async (registrationType) => {
      await scaffold('control', {
        registrationType,
        controlRegistrationsPath: './shared/absent-registrations.ts',
      });

      expect(warnings).toContain(
        `Registration file ${src('shared/absent-registrations.ts')} could not be found. Skipping registration.`,
      );
    },
  );

  it.each<'control' | 'group' | 'array'>(['control', 'group', 'array'])(
    'names the resolved path when the %s helper file does not exist',
    async (schematicName) => {
      const tree = await scaffold(schematicName, {
        viewProviderHelperPath: './app/absent',
      });
      const generated = read(tree, app(`test/test-${schematicName}.ts`));

      expect(warnings).toContain(
        `View provider helper ${src('app/absent/view-provider.ts')} could not be found. Using the verbose syntax.`,
      );
      expect(generated).toContain('ControlContainer');
    },
  );

  it('uses a helper file directly at the workspace root', async () => {
    appTree.create('/view-provider.ts', 'export const viewProviders = [];\n');

    const tree = await scaffold('control', {
      viewProviderHelperPath: '/view-provider.ts',
    });
    const generated = read(tree, app('test/test-control.ts'));

    expect(generated).toContain(
      `from '${buildRelativePath(app('test/test-control.ts'), '/view-provider')}'`,
    );
    expect(warnings.filter((w) => w.includes('View provider'))).toEqual([]);
  });

  it('treats a helper path above the workspace root as a missing helper', async () => {
    const tree = await scaffold('control', {
      viewProviderHelperPath: '../../../../helper',
    });

    expect(warnings).toContain(
      'View provider helper ../../../../helper could not be found. Using the verbose syntax.',
    );
    expect(read(tree, app('test/test-control.ts'))).toContain(
      'ControlContainer',
    );
  });

  it('treats a registrations path above the workspace root as a missing file', async () => {
    const tree = await scaffold('control', {
      controlRegistrationsPath: '../../../../registrations.ts',
    });

    expect(warnings).toContain(
      'Registration file ../../../../registrations.ts could not be found. Skipping registration.',
    );
    expect(exists(tree, app('test/test-control.ts'))).toBe(true);
  });

  it.each<[string, 'token' | 'config']>([
    ['token', 'token'],
    ['config', 'config'],
  ])(
    'warns when the %s registrations file holds no registrations',
    async (_, registrationType) => {
      appTree.create(app('holds-nothing.ts'), 'export const nothing = {};\n');

      const tree = await scaffold('control', {
        registrationType,
        controlRegistrationsPath: 'app/holds-nothing.ts',
      });

      expect(warnings).toContain(
        `Registration file ${app('holds-nothing.ts')} holds no component registrations. Skipping registration.`,
      );
      expect(read(tree, app('holds-nothing.ts'))).toBe(
        'export const nothing = {};\n',
      );
    },
  );

  it('names a --path above the workspace root', async () => {
    await expect(
      scaffold('control', { path: '../../../../forms' }),
    ).rejects.toThrow(
      '"path" points outside the workspace root: ../../../../forms',
    );
  });

  it('names a configured generator path above the workspace root', async () => {
    writeJson(appTree, app('formbar-schematic.config.json'), {
      control: { path: '../../../../forms' },
    });

    await expect(scaffold('control')).rejects.toThrow(
      '"control.path" points outside the workspace root: ../../../../forms',
    );
  });

  it('does not warn about a helper when no helper path is configured', async () => {
    await scaffold('control');

    expect(warnings.filter((w) => w.includes('View provider'))).toEqual([]);
  });

  it('does not warn about a helper the block generator has no use for', async () => {
    await scaffold('block', { viewProviderHelperPath: 'app/absent' });

    expect(warnings.filter((w) => w.includes('View provider'))).toEqual([]);
  });
});
