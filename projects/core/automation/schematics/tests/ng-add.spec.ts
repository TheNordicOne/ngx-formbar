import { beforeEach, describe, expect, it } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { join } from 'path';
import { Schema } from '../ng-add/schema';
import {
  BaseGenerateSchematicConfig,
  NgxFormworkAutomationConfig,
} from '../../shared/shared-config.type';
import {
  app,
  callObjectArgHasProp,
  countCall,
  countNamedImport,
  providersArrayContainsCall,
  providersArrayContainsIdentifier,
  providersArrayContainsProviderObject,
  read,
  src,
} from './helper';
import { setupWorkspace } from './workspace-setup';
import { parseTS } from '../shared/ast/parse';
import {
  hasNamedImport,
  importForSymbolUsesCorrectRelativePath,
} from '../shared/ast/imports';
import { DEFAULT_HELPER_PATH } from '../../shared/constants';

const COLLECTION_PATH = join(
  __dirname,
  '../../../../../dist/core/schematics/collection.json',
);

describe('ng-add schematic', () => {
  const baseOptions = { project: 'test-app' };
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;

  const registrations = app('registrations');
  const helperDir = app('shared/helper');
  const appConfigPath = app('app.config.ts');
  const formworkConfigPath = app('formwork.config.ts');
  const formworkConfigImportPath = formworkConfigPath.split('.ts')[0];
  const schematicsConfigPath = app('formwork.config.json');

  async function runAdd(options: Schema = {}) {
    return runner.runSchematic(
      'ng-add',
      { ...baseOptions, ...options },
      appTree,
    );
  }

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);

    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);
    appTree = await setupWorkspace(runner);
  });

  it('is idempotent: no duplicate import or provider call on re-run', async () => {
    const once = await runAdd();
    const twice = await runner.runSchematic('ng-add', baseOptions, once);

    const sf = parseTS(read(twice, appConfigPath));

    expect(countNamedImport(sf, 'ngx-formwork', 'provideFormwork')).toBe(1);
    expect(countCall(sf, 'provideFormwork')).toBe(1);
  });

  describe('Default', () => {
    it('imports provideFormwork from ngx-formwork', async () => {
      const tree = await runAdd();
      expect(tree.exists(appConfigPath)).toBe(true);

      const sf = parseTS(read(tree, appConfigPath));
      expect(hasNamedImport(sf, 'ngx-formwork', 'provideFormwork')).toBe(true);
    });

    it('provides formwork and component registration providers in providers array', async () => {
      const tree = await runAdd();
      const sf = parseTS(read(tree, appConfigPath));

      expect(providersArrayContainsCall(sf, 'provideFormwork')).toBe(true);
      expect(
        providersArrayContainsIdentifier(sf, 'componentRegistrationsProvider'),
      ).toBe(true);
    });

    it('generates token-based registration files, helper files, and registration configuration', async () => {
      const tree = await runAdd();

      expect(tree.exists(`${registrations}/component-registrations.ts`)).toBe(
        true,
      );
      expect(tree.exists(`${registrations}/validator-registrations.ts`)).toBe(
        true,
      );
      expect(
        tree.exists(`${registrations}/async-validator-registrations.ts`),
      ).toBe(true);
      expect(tree.exists(`${registrations}/index.ts`)).toBe(true);

      expect(tree.exists(`${helperDir}/block.host-directive.ts`)).toBe(true);
      expect(tree.exists(`${helperDir}/group.host-directive.ts`)).toBe(true);
      expect(tree.exists(`${helperDir}/control.host-directive.ts`)).toBe(true);
      expect(
        tree.exists(`${helperDir}/control-container.view-provider.ts`),
      ).toBe(true);

      expect(tree.exists(formworkConfigPath)).toBe(true);
    });

    it('uses schematic config without values', async () => {
      const tree = await runAdd();

      const schematicsConfig = JSON.parse(
        read(tree, schematicsConfigPath),
      ) as NgxFormworkAutomationConfig;

      expect(schematicsConfig.registrationType).toBeUndefined();
      expect(schematicsConfig.controlRegistrationsPath).toBeUndefined();
      expect(schematicsConfig.viewProviderHelperPath).toBe(DEFAULT_HELPER_PATH);
      expect(schematicsConfig.control?.hostDirectiveHelperPath).toBe(
        DEFAULT_HELPER_PATH,
      );
      expect(schematicsConfig.group?.hostDirectiveHelperPath).toBe(
        DEFAULT_HELPER_PATH,
      );
      expect(schematicsConfig.block?.hostDirectiveHelperPath).toBe(
        DEFAULT_HELPER_PATH,
      );
    });
  });

  describe('Registration Style Token', () => {
    it('generates config-based registration files and formwork.config.ts', async () => {
      const tree = await runAdd({ registrationStyle: 'token' });

      const providerConfig = parseTS(read(tree, formworkConfigPath));
      const appConfig = parseTS(read(tree, appConfigPath));

      const hasComponentRegistrations = callObjectArgHasProp(
        providerConfig,
        'defineFormworkConfig',
        'componentRegistrations',
        'shorthand',
      );

      const hasComponentProviders = providersArrayContainsIdentifier(
        appConfig,
        'componentRegistrationsProvider',
      );
      const hasValidatorProviders = providersArrayContainsIdentifier(
        appConfig,
        'validatorRegistrationsProvider',
      );
      const hasAsyncValidatorProviders = providersArrayContainsIdentifier(
        appConfig,
        'asyncValidatorRegistrationsProvider',
      );

      const usesCorrectRegistrationsPath =
        importForSymbolUsesCorrectRelativePath(
          appConfig,
          appConfigPath,
          'componentRegistrationsProvider',
          registrations,
        );

      const usesCorrectConfigPath = importForSymbolUsesCorrectRelativePath(
        appConfig,
        appConfigPath,
        'formworkConfig',
        formworkConfigImportPath,
      );

      expect(tree.exists(`${registrations}/component-registrations.ts`)).toBe(
        true,
      );
      expect(tree.exists(`${registrations}/validator-registrations.ts`)).toBe(
        true,
      );
      expect(
        tree.exists(`${registrations}/async-validator-registrations.ts`),
      ).toBe(true);
      expect(tree.exists(`${registrations}/index.ts`)).toBe(true);
      expect(hasComponentRegistrations).toBe(false);
      expect(hasComponentProviders).toBe(true);
      expect(hasValidatorProviders).toBe(true);
      expect(hasAsyncValidatorProviders).toBe(true);
      expect(usesCorrectRegistrationsPath).toBe(true);
      expect(usesCorrectConfigPath).toBe(true);
    });

    it('respects validator flags', async () => {
      const tree = await runAdd({
        registrationStyle: 'token',
        includeSyncValidators: false,
        includeAsyncValidators: false,
      });

      const appConfig = parseTS(read(tree, appConfigPath));

      const hasComponentProviders = providersArrayContainsIdentifier(
        appConfig,
        'componentRegistrationsProvider',
      );
      const hasValidatorProviders = providersArrayContainsIdentifier(
        appConfig,
        'validatorRegistrationsProvider',
      );
      const hasAsyncValidatorProviders = providersArrayContainsIdentifier(
        appConfig,
        'asyncValidatorRegistrationsProvider',
      );

      expect(tree.exists(`${registrations}/validator-registrations.ts`)).toBe(
        false,
      );
      expect(
        tree.exists(`${registrations}/async-validator-registrations.ts`),
      ).toBe(false);

      expect(hasComponentProviders).toBe(true);
      expect(hasValidatorProviders).toBe(false);
      expect(hasAsyncValidatorProviders).toBe(false);
    });

    it('is not affecting token files by setting provideInline to true', async () => {
      const tree = await runAdd({
        registrationStyle: 'token',
        includeSyncValidators: true,
        includeAsyncValidators: true,
        provideInline: true,
      });

      const appConfig = parseTS(read(tree, appConfigPath));

      const hasComponentProviders = providersArrayContainsIdentifier(
        appConfig,
        'componentRegistrationsProvider',
      );
      const hasValidatorProviders = providersArrayContainsIdentifier(
        appConfig,
        'validatorRegistrationsProvider',
      );
      const hasAsyncValidatorProviders = providersArrayContainsIdentifier(
        appConfig,
        'asyncValidatorRegistrationsProvider',
      );

      expect(tree.exists(`${registrations}/component-registrations.ts`)).toBe(
        true,
      );
      expect(tree.exists(`${registrations}/index.ts`)).toBe(true);
      expect(tree.exists(formworkConfigPath)).toBe(false);
      expect(hasComponentProviders).toBe(true);
      expect(hasValidatorProviders).toBe(true);
      expect(hasAsyncValidatorProviders).toBe(true);
    });

    it('adds providers directly in app.config.ts if splitRegistrations is set to false', async () => {
      const tree = await runAdd({
        registrationStyle: 'token',
        includeSyncValidators: true,
        includeAsyncValidators: true,
        splitRegistrations: false,
      });

      const appConfig = parseTS(read(tree, appConfigPath));
      const hasComponentProviders = providersArrayContainsProviderObject(
        appConfig,
        'NGX_FW_COMPONENT_REGISTRATIONS',
      );
      const hasValidatorProviders = providersArrayContainsProviderObject(
        appConfig,
        'NGX_FW_VALIDATOR_REGISTRATIONS',
      );
      const hasAsyncValidatorProviders = providersArrayContainsProviderObject(
        appConfig,
        'NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS',
      );

      expect(tree.exists(`${registrations}/component-registrations.ts`)).toBe(
        false,
      );
      expect(tree.exists(`${registrations}/index.ts`)).toBe(false);
      expect(tree.exists(`${registrations}/validator-registrations.ts`)).toBe(
        false,
      );
      expect(
        tree.exists(`${registrations}/async-validator-registrations.ts`),
      ).toBe(false);

      expect(hasComponentProviders).toBe(true);
      expect(hasValidatorProviders).toBe(true);
      expect(hasAsyncValidatorProviders).toBe(true);
    });

    it('uses the user provided registrationsPath', async () => {
      const registrationsPath = 'app/management/forms';
      const finalPath = src(registrationsPath);
      const tree = await runAdd({
        registrationStyle: 'token',
        includeSyncValidators: true,
        includeAsyncValidators: true,
        registrationsPath,
      });

      const appConfig = parseTS(read(tree, appConfigPath));

      const usesCorrectRelativePath = importForSymbolUsesCorrectRelativePath(
        appConfig,
        appConfigPath,
        'componentRegistrationsProvider',
        finalPath,
      );

      expect(tree.exists(`${finalPath}/component-registrations.ts`)).toBe(true);
      expect(tree.exists(`${finalPath}/index.ts`)).toBe(true);
      expect(tree.exists(`${finalPath}/validator-registrations.ts`)).toBe(true);
      expect(tree.exists(`${finalPath}/async-validator-registrations.ts`)).toBe(
        true,
      );

      expect(usesCorrectRelativePath).toBe(true);
    });
  });

  describe('Registration Style Config', () => {
    it('generates config-based registration files and formwork.config.ts', async () => {
      const tree = await runAdd({ registrationStyle: 'config' });
      const providerConfig = parseTS(read(tree, formworkConfigPath));
      const appConfig = parseTS(read(tree, appConfigPath));

      const appConfigUsesFormworkConfig = callObjectArgHasProp(
        appConfig,
        'provideFormwork',
        'formworkConfig',
        'identifier',
      );

      const providerConfigHasComponentRegistrations = callObjectArgHasProp(
        providerConfig,
        'defineFormworkConfig',
        'componentRegistrations',
        'shorthand',
      );

      const providerConfigHasValidatorRegistrations = callObjectArgHasProp(
        providerConfig,
        'defineFormworkConfig',
        'validatorRegistrations',
        'shorthand',
      );

      const providerConfigHasAsyncValidatorRegistrations = callObjectArgHasProp(
        providerConfig,
        'defineFormworkConfig',
        'asyncValidatorRegistrations',
        'shorthand',
      );

      expect(tree.exists(`${registrations}/component-registrations.ts`)).toBe(
        true,
      );
      expect(tree.exists(`${registrations}/validator-registrations.ts`)).toBe(
        true,
      );
      expect(
        tree.exists(`${registrations}/async-validator-registrations.ts`),
      ).toBe(true);
      expect(tree.exists(`${registrations}/index.ts`)).toBe(true);

      expect(appConfigUsesFormworkConfig).toBe(true);

      expect(providerConfigHasComponentRegistrations).toBe(true);
      expect(providerConfigHasValidatorRegistrations).toBe(true);
      expect(providerConfigHasAsyncValidatorRegistrations).toBe(true);
    });

    it('respects validator flags', async () => {
      const tree = await runAdd({
        registrationStyle: 'config',
        includeSyncValidators: false,
        includeAsyncValidators: false,
      });

      expect(tree.exists(`${registrations}/validator-registrations.ts`)).toBe(
        false,
      );
      expect(
        tree.exists(`${registrations}/async-validator-registrations.ts`),
      ).toBe(false);
    });

    it('does not create a registration files and adds registrations directly to config, if splitRegistrations is set to false', async () => {
      const tree = await runAdd({
        registrationStyle: 'config',
        includeSyncValidators: true,
        includeAsyncValidators: true,
        provideInline: false,
        splitRegistrations: false,
      });

      const providerConfig = parseTS(read(tree, formworkConfigPath));

      const providerConfigHasComponentRegistrations = callObjectArgHasProp(
        providerConfig,
        'defineFormworkConfig',
        'componentRegistrations',
        'object',
      );

      const providerConfigHasValidatorRegistrations = callObjectArgHasProp(
        providerConfig,
        'defineFormworkConfig',
        'validatorRegistrations',
        'object',
      );

      const providerConfigHasAsyncValidatorRegistrations = callObjectArgHasProp(
        providerConfig,
        'defineFormworkConfig',
        'asyncValidatorRegistrations',
        'object',
      );

      expect(tree.exists(`${registrations}/component-registrations.ts`)).toBe(
        false,
      );
      expect(tree.exists(`${registrations}/validator-registrations.ts`)).toBe(
        false,
      );
      expect(
        tree.exists(`${registrations}/async-validator-registrations.ts`),
      ).toBe(false);
      expect(tree.exists(`${registrations}/index.ts`)).toBe(false);

      expect(tree.exists(formworkConfigPath)).toBe(true);

      expect(providerConfigHasComponentRegistrations).toBe(true);
      expect(providerConfigHasValidatorRegistrations).toBe(true);
      expect(providerConfigHasAsyncValidatorRegistrations).toBe(true);
    });

    it('uses the user provided registrationsPath', async () => {
      const registrationsPath = 'app/management/forms';
      const finalPath = src(registrationsPath);
      const tree = await runAdd({
        registrationStyle: 'config',
        includeSyncValidators: true,
        includeAsyncValidators: true,
        registrationsPath,
      });

      const formworkConfig = parseTS(read(tree, formworkConfigPath));

      const usesCorrectRelativePath = importForSymbolUsesCorrectRelativePath(
        formworkConfig,
        formworkConfigPath,
        'componentRegistrations',
        finalPath,
      );

      expect(tree.exists(`${finalPath}/component-registrations.ts`)).toBe(true);
      expect(tree.exists(`${finalPath}/index.ts`)).toBe(true);
      expect(tree.exists(`${finalPath}/validator-registrations.ts`)).toBe(true);
      expect(tree.exists(`${finalPath}/async-validator-registrations.ts`)).toBe(
        true,
      );

      expect(usesCorrectRelativePath).toBe(true);
    });

    describe('provideInline is set to true', () => {
      it('does not create a registration config, but still splits configuration, if splitRegistrations is set to true ', async () => {
        const tree = await runAdd({
          registrationStyle: 'config',
          includeSyncValidators: true,
          includeAsyncValidators: true,
          provideInline: true,
        });

        const appConfig = parseTS(read(tree, appConfigPath));

        const appConfigHasComponentRegistrations = callObjectArgHasProp(
          appConfig,
          'provideFormwork',
          'componentRegistrations',
          'shorthand',
        );

        const appConfigHasValidatorRegistrations = callObjectArgHasProp(
          appConfig,
          'provideFormwork',
          'validatorRegistrations',
          'shorthand',
        );

        const appConfigHasAsyncValidatorRegistrations = callObjectArgHasProp(
          appConfig,
          'provideFormwork',
          'asyncValidatorRegistrations',
          'shorthand',
        );

        expect(tree.exists(`${registrations}/component-registrations.ts`)).toBe(
          true,
        );
        expect(tree.exists(`${registrations}/validator-registrations.ts`)).toBe(
          true,
        );
        expect(
          tree.exists(`${registrations}/async-validator-registrations.ts`),
        ).toBe(true);
        expect(tree.exists(`${registrations}/index.ts`)).toBe(true);

        expect(tree.exists(formworkConfigPath)).toBe(false);

        expect(appConfigHasComponentRegistrations).toBe(true);
        expect(appConfigHasValidatorRegistrations).toBe(true);
        expect(appConfigHasAsyncValidatorRegistrations).toBe(true);
      });

      it("does not create a registration config and doesn't splits configuration, if splitRegistrations is set to false", async () => {
        const tree = await runAdd({
          registrationStyle: 'config',
          includeSyncValidators: true,
          includeAsyncValidators: true,
          provideInline: true,
          splitRegistrations: false,
        });

        const appConfig = parseTS(read(tree, appConfigPath));

        const appConfigHasComponentRegistrations = callObjectArgHasProp(
          appConfig,
          'provideFormwork',
          'componentRegistrations',
          'object',
        );

        const appConfigHasValidatorRegistrations = callObjectArgHasProp(
          appConfig,
          'provideFormwork',
          'validatorRegistrations',
          'object',
        );

        const appConfigHasAsyncValidatorRegistrations = callObjectArgHasProp(
          appConfig,
          'provideFormwork',
          'asyncValidatorRegistrations',
          'object',
        );

        expect(tree.exists(`${registrations}/component-registrations.ts`)).toBe(
          false,
        );
        expect(tree.exists(`${registrations}/validator-registrations.ts`)).toBe(
          false,
        );
        expect(
          tree.exists(`${registrations}/async-validator-registrations.ts`),
        ).toBe(false);
        expect(tree.exists(`${registrations}/index.ts`)).toBe(false);

        expect(tree.exists(formworkConfigPath)).toBe(false);

        expect(appConfigHasComponentRegistrations).toBe(true);
        expect(appConfigHasValidatorRegistrations).toBe(true);
        expect(appConfigHasAsyncValidatorRegistrations).toBe(true);
      });
    });
  });

  describe('Other options', () => {
    it('skips helper files (useHelper = false)', async () => {
      const tree = await runAdd({
        useHelper: false,
      });

      expect(tree.exists(`${helperDir}/block.host-directive.ts`)).toBe(false);
      expect(tree.exists(`${helperDir}/group.host-directive.ts`)).toBe(false);
      expect(tree.exists(`${helperDir}/control.host-directive.ts`)).toBe(false);
      expect(
        tree.exists(`${helperDir}/control-container.view-provider.ts`),
      ).toBe(false);
    });

    it('uses the user provided helperPath', async () => {
      const helperPath = 'app/management/forms/helper';
      const finalPath = src(helperPath);
      const tree = await runAdd({
        useHelper: true,
        helperPath,
      });

      expect(tree.exists(`${finalPath}/block.host-directive.ts`)).toBe(true);
      expect(tree.exists(`${finalPath}/group.host-directive.ts`)).toBe(true);
      expect(tree.exists(`${finalPath}/control.host-directive.ts`)).toBe(true);
      expect(
        tree.exists(`${finalPath}/control-container.view-provider.ts`),
      ).toBe(true);
    });

    it('uses the user provided providerConfigPath and providerConfigFileName', async () => {
      const providerConfigPath = 'app/management/forms';
      const providerConfigFileName = 'providers.ts';
      const tree = await runAdd({
        provideInline: false,
        providerConfigPath,
        providerConfigFileName,
      });

      expect(
        tree.exists(`${src(providerConfigPath)}/${providerConfigFileName}`),
      ).toBe(true);
    });
  });

  describe('Schematics Config', () => {
    describe('useSchematicConfig is set to false', () => {
      it('does not create a schematics config file', async () => {
        const tree = await runAdd({
          useSchematicConfig: false,
        });

        expect(tree.exists(schematicsConfigPath)).toBe(false);
      });

      it('writes all user provided configurations in angular.json', async () => {
        const helperPath = 'app/management/forms/helper';
        const tree = await runAdd({
          useSchematicConfig: false,
          helperPath,
        });

        const angularJson = JSON.parse(read(tree, 'angular.json')) as {
          projects: {
            'test-app': {
              schematics: {
                'ngx-formwork:control'?: BaseGenerateSchematicConfig;
                'ngx-formwork:group'?: BaseGenerateSchematicConfig;
                'ngx-formwork:block'?: BaseGenerateSchematicConfig;
              };
            };
          };
        };

        const schematicsConfig = angularJson.projects['test-app'].schematics;
        const controlConfig = schematicsConfig['ngx-formwork:control'];
        const groupConfig = schematicsConfig['ngx-formwork:group'];
        const blockConfig = schematicsConfig['ngx-formwork:block'];

        expect(controlConfig?.hostDirectiveHelperPath).toBe(helperPath);
        expect(groupConfig?.hostDirectiveHelperPath).toBe(helperPath);
        expect(blockConfig?.hostDirectiveHelperPath).toBe(helperPath);
      });
    });

    describe('useSchematicConfig is set to true', () => {
      it('writes all user provided configurations in config file', async () => {
        const helperPath = 'app/management/forms/helper';
        const registrationsPath = 'app/management/forms/registrations';
        const providerConfigPath = 'app/management/forms';
        const providerConfigFileName = 'providers.ts';

        const tree = await runAdd({
          registrationStyle: 'config',
          useSchematicConfig: true,
          helperPath,
          registrationsPath,
          providerConfigPath,
          providerConfigFileName,
        });

        const schematicsConfig = JSON.parse(
          read(tree, schematicsConfigPath),
        ) as NgxFormworkAutomationConfig;

        expect(schematicsConfig.registrationType).toBe('config');
        expect(schematicsConfig.controlRegistrationsPath).toBe(
          registrationsPath,
        );
        expect(schematicsConfig.viewProviderHelperPath).toBe(helperPath);

        expect(schematicsConfig.control?.hostDirectiveHelperPath).toBe(
          helperPath,
        );
        expect(schematicsConfig.group?.hostDirectiveHelperPath).toBe(
          helperPath,
        );
        expect(schematicsConfig.block?.hostDirectiveHelperPath).toBe(
          helperPath,
        );
      });

      it('uses the user provided schematicsConfigPath && schematicConfigFileName', async () => {
        const schematicsConfigPath = 'app/management/forms';
        const schematicConfigFileName = 'schemas.json';
        const tree = await runAdd({
          useSchematicConfig: true,
          schematicsConfigPath,
          schematicConfigFileName,
        });

        expect(
          tree.exists(
            `${src(schematicsConfigPath)}/${schematicConfigFileName}`,
          ),
        ).toBe(true);
      });
    });
  });
});
