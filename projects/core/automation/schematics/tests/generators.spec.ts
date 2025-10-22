import { beforeEach, describe, expect, it } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';

import { Schema as GenerateOptions } from '../shared/schema';
import { COLLECTION_PATH, setupWorkspace } from './workspace-setup';
import {
  classDeclarationExists,
  componentSelectorEquals,
  decoratorArrayPropContainsIdentifier,
  decoratorArrayPropContainsProviderObject,
  decoratorHostDirectivesHasInlineDirectiveWithInputs,
  decoratorPropInitializerIsIdentifier,
  hasNamedImport,
  importForSymbolUsesCorrectRelativePath,
  interfaceHasTypeLiteral,
  parseTS,
} from './helper';

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

  const componentPath = '/test/test/test-control.component.ts';

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
    it('uses view provider helper if provided', async () => {
      const tree = await runSchematic('control', { viewProviderHelperPath });

      const sf = parseTS(tree.readText(componentPath));

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

      const sf = parseTS(tree.readText(componentPath));

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
      const sf = parseTS(tree.readText(componentPath));

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
      const options: GenerateOptions = {
        project: 'test-app',
        name: 'profile',
        key: 'user',
        path: 'features/account',
        interfaceSuffix: 'Field',
        componentSuffix: 'Widget',
      };

      const tree = await runSchematic('control', options);

      const baseDir = '/features/account/profile';
      const componentFilePath = `${baseDir}/profile-widget.component.ts`;

      const typeFilePath = `${baseDir}/profile-field.type.ts`;

      const componentSf = parseTS(tree.readText(componentFilePath));
      const typeSf = parseTS(tree.readText(typeFilePath));

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

    // Registers the created control (multiple tests for different registration scenarios)
  });

  describe.skip('with a configuration file', () => {
    // Creates a control with values from configuration
    // overwrites values from configuration with CLI options
    // Registers the created control to default location
    // Registers the created control to configured location
    // does not register the created control if skipRegistration is set to true
    // skips registration if control registrations file is not found
  });

  describe.skip('with configuration via angular.json', () => {
    // placeholder
  });
});
