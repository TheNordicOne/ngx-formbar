import { beforeEach, describe, expect, it } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';

import { Schema as GenerateOptions } from '../shared/schema';
import {
  addHelperIndexFile,
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
  exists,
  hasDynamicImportOf,
  read,
  src,
  writeJson,
} from './helper';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import {
  appConfigProvidersComponentRegistrationsMapHasIdentifier,
  classDeclarationExists,
  classImplementsInterface,
  componentRegistrationsMapProviderHasIdentifier,
  componentSelectorEquals,
  decoratorHasProp,
  decoratorPropInitializerIsIdentifier,
  defineFormbarConfigComponentRegistrationsHasIdentifier,
  directComponentRegistrationsHasIdentifier,
  hasNamedImport,
  importForSymbolUsesCorrectRelativePath,
  interfaceHasTypeLiteral,
  NgxFormbarAutomationConfig,
  parseTS,
  provideFormbarComponentRegistrationsHasIdentifier,
} from '@ngx-formbar/setup';
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
        expect(exists(tree, app('test/test-control.component.html'))).toBe(true);
        expect(exists(tree, app('test/test-control-config.type.ts'))).toBe(true);

        const componentSf = parseTS(
          read(tree, app('test/test-control.component.ts')),
        );
        expect(classDeclarationExists(componentSf, 'TestControlComponent')).toBe(
          true,
        );
      });

      it('reads the Angular component type from the workspace level', async () => {
        setComponentTypeConfig(appTree, { type: 'component' }, 'workspace');
        const tree = await runSchematic('control');

        expect(exists(tree, app('test/test-control.component.ts'))).toBe(true);
        expect(exists(tree, app('test/test-control-config.type.ts'))).toBe(true);
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
        expect(classDeclarationExists(componentSf, 'TestControlComponent')).toBe(
          false,
        );
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

      const hasClass = classDeclarationExists(
        componentSf,
        'ProfileWidget',
      );
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

    it('registers the created control with the token provider if registrations are not split', async () => {
      provideTokenNoSplit(appTree, appConfigPathRaw);
      const tree = await runSchematic('control');
      const appConfigSf = parseTS(read(tree, appConfigPath));

      const importsComponent = hasDynamicImportOf(
        appConfigSf,
        'TestControl',
      );

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

      const hasClass = classDeclarationExists(
        componentSf,
        'ProfileWidget',
      );
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

        const importsComponent = hasDynamicImportOf(
          appConfigSf,
          'TestControl',
        );

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
