import { beforeEach, describe, expect, it } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';

import { Schema as GenerateOptions } from '../shared/schema';
import {
  COLLECTION_PATH,
  provideMap,
  provideMapInlineNoSplit,
  provideMapNoSplit,
  provideToken,
  provideTokenNoSplit,
  setupWorkspace,
} from './workspace-setup';
import { app, read, src, writeJson } from './helper';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { NgxFormworkAutomationConfig } from '../../shared/shared-config.type';
import { parseTS } from '../shared/ast/parse';
import {
  hasNamedImport,
  importForSymbolUsesCorrectRelativePath,
} from '../shared/ast/imports';
import {
  componentSelectorEquals,
  decoratorArrayPropContainsIdentifier,
  decoratorArrayPropContainsProviderObject,
  decoratorHostDirectivesHasInlineDirectiveWithInputs,
  decoratorPropInitializerIsIdentifier,
} from '../shared/ast/decorators';
import {
  classDeclarationExists,
  interfaceHasTypeLiteral,
} from '../shared/ast/types';
import {
  appConfigProvidersComponentRegistrationsMapHasIdentifier,
  componentRegistrationsMapProviderHasIdentifier,
  defineFormworkConfigComponentRegistrationsHasIdentifier,
  directComponentRegistrationsHasIdentifier,
  provideFormworkComponentRegistrationsHasIdentifier,
} from '../shared/ast/registrations';

const appConfigPathRaw = 'app.config.ts';
const formworkConfigPath = 'app/formwork.config.ts';
const registrationsPath = 'app/registrations/component-registrations.ts';
const schematicsConfigPath = 'app/formwork.config.json';

describe('control schematic', () => {
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;

  const baseOptions: GenerateOptions = {
    project: 'test-app',
    key: 'test',
  };

  const viewProviderHelperPath =
    'app/shared/helper/control-container.view-provider';

  const hostDirectiveHelperPath = 'app/shared/helper/control.host-directive';

  const defaultComponentOutputPath = app('test/test-control.component.ts');
  const appConfigPath = app(appConfigPathRaw);

  async function runSchematic(
    schematicName: 'control' | 'group' | 'block',
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

    it('uses view provider helper if provided', async () => {
      const tree = await runSchematic('control', { viewProviderHelperPath });

      const sf = parseTS(read(tree, defaultComponentOutputPath));

      const importsViewProviderHelper = hasNamedImport(
        sf,
        viewProviderHelperPath,
        'controlContainerViewProviders',
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
        'controlContainerViewProviders',
      );

      expect(importsViewProviderHelper).toBe(true);
      expect(importsControlContainerFromAngular).toBe(false);
      expect(hasViewProviderInDecorator).toBe(true);
    });

    it('uses host directive helper if provided', async () => {
      const tree = await runSchematic('control', { hostDirectiveHelperPath });

      const sf = parseTS(read(tree, defaultComponentOutputPath));

      const importsControlHostDirectiveHelper = hasNamedImport(
        sf,
        hostDirectiveHelperPath,
        'ngxfwControlHostDirective',
      );

      const hasControlHostDirectiveInDecorator =
        decoratorArrayPropContainsIdentifier(
          sf,
          'Component',
          'hostDirectives',
          'ngxfwControlHostDirective',
        );

      expect(importsControlHostDirectiveHelper).toBe(true);
      expect(hasControlHostDirectiveInDecorator).toBe(true);
    });

    it('falls back to inline providers and host directive when helpers are not provided', async () => {
      const tree = await runSchematic('control');
      const sf = parseTS(read(tree, defaultComponentOutputPath));

      const importsControlContainerFromAngular = hasNamedImport(
        sf,
        '@angular/forms',
        'ControlContainer',
      );

      const hasViewProvidersInDecorator =
        decoratorArrayPropContainsProviderObject(
          sf,
          'Component',
          'viewProviders',
          'ControlContainer',
        );

      const importsDirective = hasNamedImport(
        sf,
        'ngx-formwork',
        'NgxfwControlDirective',
      );

      const hasControlDirectiveInDecorator =
        decoratorHostDirectivesHasInlineDirectiveWithInputs(
          sf,
          'NgxfwControlDirective',
          ['content', 'name'],
        );

      expect(importsControlContainerFromAngular).toBe(true);
      expect(hasViewProvidersInDecorator).toBe(true);
      expect(hasControlDirectiveInDecorator).toBe(true);
      expect(importsDirective).toBe(true);
      expect(hasControlDirectiveInDecorator).toBe(true);
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
      const componentFilePath = `${baseDir}/profile-widget.component.ts`;

      const typeFilePath = `${baseDir}/profile-field.type.ts`;

      const componentSf = parseTS(read(tree, componentFilePath));
      const typeSf = parseTS(read(tree, typeFilePath));

      const hasClass = classDeclarationExists(
        componentSf,
        'ProfileWidgetComponent',
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

      const componentImportPath = buildRelativePath(
        src(registrationsPath),
        defaultComponentOutputPath,
      );

      const importsComponent = hasNamedImport(
        componentRegistrationsSf,
        componentImportPath,
        'TestControlComponent',
      );

      const hasRegistration = componentRegistrationsMapProviderHasIdentifier(
        componentRegistrationsSf,
        'test',
        'TestControlComponent',
      );

      expect(importsComponent).toBe(true);
      expect(hasRegistration).toBe(true);
    });

    it('registers the created control with the token provider if registrations are not split', async () => {
      provideTokenNoSplit(appTree, appConfigPathRaw);
      const tree = await runSchematic('control');
      const appConfigSf = parseTS(read(tree, appConfigPath));

      const componentImportPath = buildRelativePath(
        appConfigPath,
        defaultComponentOutputPath,
      );

      const importsComponent = hasNamedImport(
        appConfigSf,
        componentImportPath,
        'TestControlComponent',
      );

      const hasRegistration =
        appConfigProvidersComponentRegistrationsMapHasIdentifier(
          appConfigSf,
          'test',
          'TestControlComponent',
        );

      expect(importsComponent).toBe(true);
      expect(hasRegistration).toBe(true);
    });
  });

  describe('with a configuration file', () => {
    it('creates a control with values from configuration', async () => {
      const config: NgxFormworkAutomationConfig = {
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
      const componentFilePath = `${baseDir}/profile-widget.component.ts`;
      const typeFilePath = `${baseDir}/profile-field.type.ts`;

      const componentSf = parseTS(read(tree, componentFilePath));
      const typeSf = parseTS(read(tree, typeFilePath));

      const hasClass = classDeclarationExists(
        componentSf,
        'ProfileWidgetComponent',
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
      const config: NgxFormworkAutomationConfig = {
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

      const componentImportPath = buildRelativePath(
        src(registrationsPath),
        app('email/email-control.component.ts'),
      );

      const importsComponent = hasNamedImport(
        componentRegistrationsSf,
        componentImportPath,
        'EmailControlComponent',
      );

      const hasRegistration = componentRegistrationsMapProviderHasIdentifier(
        componentRegistrationsSf,
        'user',
        'EmailControlComponent',
      );

      expect(importsComponent).toBe(true);
      expect(hasRegistration).toBe(true);
    });

    it('registers the created control to configured location', async () => {
      provideToken(appTree, appConfigPathRaw, registrationsPath);

      const config: NgxFormworkAutomationConfig = {
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

      const componentImportPath = buildRelativePath(
        src(registrationsPath),
        app('email/email-control.component.ts'),
      );

      const importsComponent = hasNamedImport(
        registrationsSf,
        componentImportPath,
        'EmailControlComponent',
      );

      const hasRegistration = componentRegistrationsMapProviderHasIdentifier(
        registrationsSf,
        'email',
        'EmailControlComponent',
      );

      expect(importsComponent).toBe(true);
      expect(hasRegistration).toBe(true);
    });

    it('does not register the created control if skipRegistration is set to true', async () => {
      const config: NgxFormworkAutomationConfig = {
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

      const componentImportPath = buildRelativePath(
        src(registrationsPath),
        app('email/email-control.component.ts'),
      );

      const importsComponent = hasNamedImport(
        registrationsSf,
        componentImportPath,
        'EmailControlComponent',
      );

      const hasRegistration =
        provideFormworkComponentRegistrationsHasIdentifier(
          registrationsSf,
          'email',
          'EmailControlComponent',
        );

      expect(importsComponent).toBe(false);
      expect(hasRegistration).toBe(false);
    });

    it('skips registration if control registrations file is not found', async () => {
      const config: NgxFormworkAutomationConfig = {
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

      const componentPath = app('email/email-control.component.ts');
      expect(tree.exists(componentPath)).toBe(true);

      expect(
        tree.exists(app('shared/forms/non-existent-registrations.ts')),
      ).toBe(false);
    });

    describe('registration style: map', () => {
      beforeEach(() => {
        const config: NgxFormworkAutomationConfig = {
          registrationType: 'map',
        };
        writeJson(appTree, src(schematicsConfigPath), config);
      });

      it('registers the created control in app.config.ts in provideFormwork', async () => {
        provideMapInlineNoSplit(appTree, appConfigPathRaw);
        const tree = await runSchematic('control');
        const appConfigSf = parseTS(read(tree, appConfigPath));

        const componentImportPath = buildRelativePath(
          appConfigPath,
          defaultComponentOutputPath,
        );

        const importsComponent = hasNamedImport(
          appConfigSf,
          componentImportPath,
          'TestControlComponent',
        );

        const hasRegistration =
          provideFormworkComponentRegistrationsHasIdentifier(
            appConfigSf,
            'test',
            'TestControlComponent',
          );

        expect(importsComponent).toBe(true);
        expect(hasRegistration).toBe(true);
      });

      it('registers the created control directly in the registrations config if registrations are not split', async () => {
        provideMapNoSplit(appTree, appConfigPathRaw, formworkConfigPath);
        const tree = await runSchematic('control');
        const formworkConfigSf = parseTS(read(tree, src(formworkConfigPath)));

        const componentImportPath = buildRelativePath(
          src(formworkConfigPath),
          defaultComponentOutputPath,
        );

        const importsComponent = hasNamedImport(
          formworkConfigSf,
          componentImportPath,
          'TestControlComponent',
        );

        const hasRegistration =
          defineFormworkConfigComponentRegistrationsHasIdentifier(
            formworkConfigSf,
            'test',
            'TestControlComponent',
          );

        expect(importsComponent).toBe(true);
        expect(hasRegistration).toBe(true);
      });

      it('registers the created control in the registrations if registrations are split', async () => {
        provideMap(
          appTree,
          appConfigPathRaw,
          registrationsPath,
          formworkConfigPath,
        );
        const tree = await runSchematic('control');
        const registrationsSf = parseTS(read(tree, src(registrationsPath)));

        const componentImportPath = buildRelativePath(
          src(registrationsPath),
          defaultComponentOutputPath,
        );

        const importsComponent = hasNamedImport(
          registrationsSf,
          componentImportPath,
          'TestControlComponent',
        );

        const hasRegistration = directComponentRegistrationsHasIdentifier(
          registrationsSf,
          'test',
          'TestControlComponent',
        );

        expect(importsComponent).toBe(true);
        expect(hasRegistration).toBe(true);
      });

      it('does not register the created control if skipRegistration is set to true', async () => {
        const config: NgxFormworkAutomationConfig = {
          control: {
            skipRegistration: true,
          },
          registrationType: 'map',
        };
        writeJson(appTree, src(schematicsConfigPath), config);
        provideMap(
          appTree,
          appConfigPathRaw,
          registrationsPath,
          formworkConfigPath,
        );

        const tree = await runSchematic('control', {
          key: 'email',
          name: 'email',
          schematicsConfig: schematicsConfigPath,
        });

        const formworkConfigSf = parseTS(read(tree, src(formworkConfigPath)));

        const componentImportPath = buildRelativePath(
          src(formworkConfigPath),
          app('email/email-control.component.ts'),
        );

        const importsComponent = hasNamedImport(
          formworkConfigSf,
          componentImportPath,
          'EmailControlComponent',
        );

        const hasRegistration =
          provideFormworkComponentRegistrationsHasIdentifier(
            formworkConfigSf,
            'email',
            'EmailControlComponent',
          );

        expect(importsComponent).toBe(false);
        expect(hasRegistration).toBe(false);
      });

      it('skips registration if control registrations file is not found', async () => {
        const config: NgxFormworkAutomationConfig = {
          control: {
            interfaceSuffix: 'Field',
            componentSuffix: 'Control',
          },
          controlRegistrationsPath:
            'shared/forms/non-existent-registrations.ts',
          registrationType: 'map',
        };
        writeJson(appTree, src(schematicsConfigPath), config);
        provideMapInlineNoSplit(appTree, appConfigPathRaw);

        const tree = await runSchematic('control', {
          key: 'email',
          name: 'email',
          schematicsConfig: schematicsConfigPath,
        });

        const componentPath = app('email/email-control.component.ts');
        expect(tree.exists(componentPath)).toBe(true);

        expect(
          tree.exists(app('shared/forms/non-existent-registrations.ts')),
        ).toBe(false);
      });
    });
  });
});
