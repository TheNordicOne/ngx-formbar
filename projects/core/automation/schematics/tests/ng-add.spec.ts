import { beforeEach, describe, expect, it } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { join } from 'path';
import { Schema } from '../ng-add/schema';
import {
  BaseGenerateSchematicConfig,
  NgxFormbarAutomationConfig,
} from '../../shared/shared-config.type';
import {
  app,
  callObjectArgHasProp,
  countCall,
  countNamedImport,
  exists,
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
import { DEFAULT_HELPER_PATH, PACKAGE_NAME } from '../../shared/constants';

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
  const formbarConfigPath = app('formbar.config.ts');
  const formbarConfigImportPath = formbarConfigPath.split('.ts')[0];
  const schematicsConfigPath = app('formbar.config.json');

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

    expect(countNamedImport(sf, PACKAGE_NAME, 'provideFormbar')).toBe(1);
    expect(countCall(sf, 'provideFormbar')).toBe(1);
  });

  describe('Default', () => {
    it('imports provideFormbar from ngx-formbar', async () => {
      const tree = await runAdd();
      expect(exists(tree, appConfigPath)).toBe(true);

      const sf = parseTS(read(tree, appConfigPath));
      expect(hasNamedImport(sf, PACKAGE_NAME, 'provideFormbar')).toBe(true);
    });

    it('provides formbar and component registration providers in providers array', async () => {
      const tree = await runAdd();
      const sf = parseTS(read(tree, appConfigPath));

      expect(providersArrayContainsCall(sf, 'provideFormbar')).toBe(true);
      expect(
        providersArrayContainsIdentifier(sf, 'componentRegistrationsProvider'),
      ).toBe(true);
    });

    it('generates token-based registration files, helper files, and registration configuration', async () => {
      const tree = await runAdd();

      expect(exists(tree, `${registrations}/component-registrations.ts`)).toBe(
        true,
      );
      expect(exists(tree, `${registrations}/validator-registrations.ts`)).toBe(
        true,
      );
      expect(
        exists(tree, `${registrations}/async-validator-registrations.ts`),
      ).toBe(true);
      expect(exists(tree, `${registrations}/index.ts`)).toBe(true);

      expect(exists(tree, `${helperDir}/block.host-directive.ts`)).toBe(true);
      expect(exists(tree, `${helperDir}/group.host-directive.ts`)).toBe(true);
      expect(exists(tree, `${helperDir}/control.host-directive.ts`)).toBe(true);
      expect(exists(tree, `${helperDir}/view-provider.ts`)).toBe(true);

      expect(exists(tree, formbarConfigPath)).toBe(true);
    });

    it('uses schematic config without values', async () => {
      const tree = await runAdd();

      const schematicsConfig = JSON.parse(
        read(tree, schematicsConfigPath),
      ) as NgxFormbarAutomationConfig;

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
    it('generates config-based registration files and formbar.config.ts', async () => {
      const tree = await runAdd({ registrationStyle: 'token' });

      const providerConfig = parseTS(read(tree, formbarConfigPath));
      const appConfig = parseTS(read(tree, appConfigPath));

      const hasComponentRegistrations = callObjectArgHasProp(
        providerConfig,
        'defineFormbarConfig',
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
        'formbarConfig',
        formbarConfigImportPath,
      );

      expect(exists(tree, `${registrations}/component-registrations.ts`)).toBe(
        true,
      );
      expect(exists(tree, `${registrations}/validator-registrations.ts`)).toBe(
        true,
      );
      expect(
        exists(tree, `${registrations}/async-validator-registrations.ts`),
      ).toBe(true);
      expect(exists(tree, `${registrations}/index.ts`)).toBe(true);
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

      expect(exists(tree, `${registrations}/validator-registrations.ts`)).toBe(
        false,
      );
      expect(
        exists(tree, `${registrations}/async-validator-registrations.ts`),
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

      expect(exists(tree, `${registrations}/component-registrations.ts`)).toBe(
        true,
      );
      expect(exists(tree, `${registrations}/index.ts`)).toBe(true);
      expect(exists(tree, formbarConfigPath)).toBe(false);
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

      expect(exists(tree, `${registrations}/component-registrations.ts`)).toBe(
        false,
      );
      expect(exists(tree, `${registrations}/index.ts`)).toBe(false);
      expect(exists(tree, `${registrations}/validator-registrations.ts`)).toBe(
        false,
      );
      expect(
        exists(tree, `${registrations}/async-validator-registrations.ts`),
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

      expect(exists(tree, `${finalPath}/component-registrations.ts`)).toBe(
        true,
      );
      expect(exists(tree, `${finalPath}/index.ts`)).toBe(true);
      expect(exists(tree, `${finalPath}/validator-registrations.ts`)).toBe(
        true,
      );
      expect(
        exists(tree, `${finalPath}/async-validator-registrations.ts`),
      ).toBe(true);

      expect(usesCorrectRelativePath).toBe(true);
    });
  });

  describe('Registration Style Config', () => {
    it('generates config-based registration files and formbar.config.ts', async () => {
      const tree = await runAdd({ registrationStyle: 'config' });
      const providerConfig = parseTS(read(tree, formbarConfigPath));
      const appConfig = parseTS(read(tree, appConfigPath));

      const appConfigUsesFormbarConfig = callObjectArgHasProp(
        appConfig,
        'provideFormbar',
        'formbarConfig',
        'identifier',
      );

      const providerConfigHasComponentRegistrations = callObjectArgHasProp(
        providerConfig,
        'defineFormbarConfig',
        'componentRegistrations',
        'shorthand',
      );

      const providerConfigHasValidatorRegistrations = callObjectArgHasProp(
        providerConfig,
        'defineFormbarConfig',
        'validatorRegistrations',
        'shorthand',
      );

      const providerConfigHasAsyncValidatorRegistrations = callObjectArgHasProp(
        providerConfig,
        'defineFormbarConfig',
        'asyncValidatorRegistrations',
        'shorthand',
      );

      expect(exists(tree, `${registrations}/component-registrations.ts`)).toBe(
        true,
      );
      expect(exists(tree, `${registrations}/validator-registrations.ts`)).toBe(
        true,
      );
      expect(
        exists(tree, `${registrations}/async-validator-registrations.ts`),
      ).toBe(true);
      expect(exists(tree, `${registrations}/index.ts`)).toBe(true);

      expect(appConfigUsesFormbarConfig).toBe(true);

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

      expect(exists(tree, `${registrations}/validator-registrations.ts`)).toBe(
        false,
      );
      expect(
        exists(tree, `${registrations}/async-validator-registrations.ts`),
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

      const providerConfig = parseTS(read(tree, formbarConfigPath));

      const providerConfigHasComponentRegistrations = callObjectArgHasProp(
        providerConfig,
        'defineFormbarConfig',
        'componentRegistrations',
        'object',
      );

      const providerConfigHasValidatorRegistrations = callObjectArgHasProp(
        providerConfig,
        'defineFormbarConfig',
        'validatorRegistrations',
        'object',
      );

      const providerConfigHasAsyncValidatorRegistrations = callObjectArgHasProp(
        providerConfig,
        'defineFormbarConfig',
        'asyncValidatorRegistrations',
        'object',
      );

      expect(exists(tree, `${registrations}/component-registrations.ts`)).toBe(
        false,
      );
      expect(exists(tree, `${registrations}/validator-registrations.ts`)).toBe(
        false,
      );
      expect(
        exists(tree, `${registrations}/async-validator-registrations.ts`),
      ).toBe(false);
      expect(exists(tree, `${registrations}/index.ts`)).toBe(false);

      expect(exists(tree, formbarConfigPath)).toBe(true);

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

      const formbarConfig = parseTS(read(tree, formbarConfigPath));

      const usesCorrectRelativePath = importForSymbolUsesCorrectRelativePath(
        formbarConfig,
        formbarConfigPath,
        'componentRegistrations',
        finalPath,
      );

      expect(exists(tree, `${finalPath}/component-registrations.ts`)).toBe(
        true,
      );
      expect(exists(tree, `${finalPath}/index.ts`)).toBe(true);
      expect(exists(tree, `${finalPath}/validator-registrations.ts`)).toBe(
        true,
      );
      expect(
        exists(tree, `${finalPath}/async-validator-registrations.ts`),
      ).toBe(true);

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
          'provideFormbar',
          'componentRegistrations',
          'shorthand',
        );

        const appConfigHasValidatorRegistrations = callObjectArgHasProp(
          appConfig,
          'provideFormbar',
          'validatorRegistrations',
          'shorthand',
        );

        const appConfigHasAsyncValidatorRegistrations = callObjectArgHasProp(
          appConfig,
          'provideFormbar',
          'asyncValidatorRegistrations',
          'shorthand',
        );

        expect(
          exists(tree, `${registrations}/component-registrations.ts`),
        ).toBe(true);
        expect(
          exists(tree, `${registrations}/validator-registrations.ts`),
        ).toBe(true);
        expect(
          exists(tree, `${registrations}/async-validator-registrations.ts`),
        ).toBe(true);
        expect(exists(tree, `${registrations}/index.ts`)).toBe(true);

        expect(exists(tree, formbarConfigPath)).toBe(false);

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
          'provideFormbar',
          'componentRegistrations',
          'object',
        );

        const appConfigHasValidatorRegistrations = callObjectArgHasProp(
          appConfig,
          'provideFormbar',
          'validatorRegistrations',
          'object',
        );

        const appConfigHasAsyncValidatorRegistrations = callObjectArgHasProp(
          appConfig,
          'provideFormbar',
          'asyncValidatorRegistrations',
          'object',
        );

        expect(
          exists(tree, `${registrations}/component-registrations.ts`),
        ).toBe(false);
        expect(
          exists(tree, `${registrations}/validator-registrations.ts`),
        ).toBe(false);
        expect(
          exists(tree, `${registrations}/async-validator-registrations.ts`),
        ).toBe(false);
        expect(exists(tree, `${registrations}/index.ts`)).toBe(false);

        expect(exists(tree, formbarConfigPath)).toBe(false);

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

      expect(exists(tree, `${helperDir}/block.host-directive.ts`)).toBe(false);
      expect(exists(tree, `${helperDir}/group.host-directive.ts`)).toBe(false);
      expect(exists(tree, `${helperDir}/control.host-directive.ts`)).toBe(
        false,
      );
      expect(exists(tree, `${helperDir}/view-provider.ts`)).toBe(false);
    });

    it('uses the user provided helperPath', async () => {
      const helperPath = 'app/management/forms/helper';
      const finalPath = src(helperPath);
      const tree = await runAdd({
        useHelper: true,
        helperPath,
      });

      expect(exists(tree, `${finalPath}/block.host-directive.ts`)).toBe(true);
      expect(exists(tree, `${finalPath}/group.host-directive.ts`)).toBe(true);
      expect(exists(tree, `${finalPath}/control.host-directive.ts`)).toBe(true);
      expect(exists(tree, `${finalPath}/view-provider.ts`)).toBe(true);
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
        exists(tree, `${src(providerConfigPath)}/${providerConfigFileName}`),
      ).toBe(true);
    });
  });

  describe('Schematics Config', () => {
    describe('useSchematicConfig is set to false', () => {
      it('does not create a schematics config file', async () => {
        const tree = await runAdd({
          useSchematicConfig: false,
        });

        expect(exists(tree, schematicsConfigPath)).toBe(false);
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
                '@ngx-formbar/core:control'?: BaseGenerateSchematicConfig;
                '@ngx-formbar/core:group'?: BaseGenerateSchematicConfig;
                '@ngx-formbar/core:block'?: BaseGenerateSchematicConfig;
              };
            };
          };
        };
        const schematicsConfig = angularJson.projects['test-app'].schematics;
        const controlConfig = schematicsConfig['@ngx-formbar/core:control'];
        const groupConfig = schematicsConfig['@ngx-formbar/core:group'];
        const blockConfig = schematicsConfig['@ngx-formbar/core:block'];

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
        ) as NgxFormbarAutomationConfig;

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
          exists(
            tree,
            `${src(schematicsConfigPath)}/${schematicConfigFileName}`,
          ),
        ).toBe(true);
      });
    });
  });
});
