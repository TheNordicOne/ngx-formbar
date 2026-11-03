import { beforeEach, describe, expect, it } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { isJsonObject, JsonObject } from '@angular-devkit/core';
import { Tree } from '@angular-devkit/schematics';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { getWorkspace } from '@schematics/angular/utility/workspace';
import { join } from 'path';
import {
  CompilerHost,
  createProgram,
  createSourceFile,
  flattenDiagnosticMessageText,
  isImportDeclaration,
  isNamedImports,
  isStringLiteral,
  ModuleKind,
  ModuleResolutionKind,
  ScriptTarget,
  SourceFile,
  transpileModule,
} from 'typescript';
import { Schema } from '../ng-add/schema';
import { NgxFormbarAutomationConfig } from '@ngx-formbar/setup';
import {
  app,
  appRoot,
  callObjectArgHasProp,
  countCall,
  countNamedImport,
  exists,
  providersArrayContainsCall,
  providersArrayContainsIdentifier,
  providersArrayContainsProviderObject,
  read,
  src,
  getDecoratorArrayProp,
  parseTS,
  hasNamedImport,
  importForSymbolUsesCorrectRelativePath,
} from '@ngx-formbar/schematics/testing';
import { setupWorkspace } from './workspace-setup';
import {
  DEFAULT_HELPER_PATH,
  REACTIVE_FORMS_PACKAGE_NAME,
} from '../shared/constants';

const COLLECTION_PATH = join(
  __dirname,
  '../../../../dist/libs/reactive-forms/schematics/collection.json',
);
const SCAFFOLD_COLLECTION_PATH = join(
  __dirname,
  '../../../../dist/libs/schematics/lib/collection.json',
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
  const schematicsConfigPath = app('formbar-schematic.config.json');
  const contentTypePath = app('types/content.type.ts');

  const generators = [
    'control',
    'group',
    'block',
    'array',
    'register',
    'schema',
  ];

  async function runAdd(options: Schema = {}) {
    return runner.runSchematic(
      'ng-add',
      { ...baseOptions, ...options },
      appTree,
    );
  }

  async function generatorDefaults(tree: UnitTestTree, project = 'test-app') {
    const workspace = await getWorkspace(tree);
    const schematics =
      workspace.projects.get(project)?.extensions.schematics ?? {};
    const byName = isJsonObject(schematics) ? schematics : {};

    return generators.map((generator) => {
      const defaults = byName[`@ngx-formbar/schematics:${generator}`];

      return defaults && isJsonObject(defaults) ? defaults : undefined;
    });
  }

  function importedFrom(sourceFile: SourceFile, moduleName: string) {
    return sourceFile.statements
      .filter(isImportDeclaration)
      .filter(
        ({ moduleSpecifier }) =>
          isStringLiteral(moduleSpecifier) &&
          moduleSpecifier.text === moduleName,
      )
      .flatMap(({ importClause }) =>
        importClause?.namedBindings &&
        isNamedImports(importClause.namedBindings)
          ? importClause.namedBindings.elements.map(({ name }) => name.text)
          : [],
      );
  }

  function syntaxErrors(code: string) {
    return (
      transpileModule(code, { reportDiagnostics: true }).diagnostics ?? []
    ).map(({ messageText }) => messageText);
  }

  /**
   * Type-checks every file of the tree. Packages stay out of reach, so only an
   * import that a file of the project does not satisfy gets reported.
   */
  function brokenImports(tree: UnitTestTree) {
    const missingExportCodes = [2305, 2459, 2614, 2724];
    const host: CompilerHost = {
      fileExists: (fileName) => tree.exists(fileName),
      readFile: (fileName) =>
        tree.exists(fileName) ? tree.readText(fileName) : undefined,
      getSourceFile: (fileName, languageVersion) =>
        tree.exists(fileName)
          ? createSourceFile(fileName, tree.readText(fileName), languageVersion)
          : undefined,
      getDefaultLibFileName: () => 'lib.d.ts',
      writeFile: () => undefined,
      getCurrentDirectory: () => '/',
      getCanonicalFileName: (fileName) => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n',
    };
    const program = createProgram(
      tree.files.filter((file) => file.endsWith('.ts')),
      {
        noLib: true,
        noEmit: true,
        experimentalDecorators: true,
        target: ScriptTarget.ES2022,
        module: ModuleKind.ESNext,
        moduleResolution: ModuleResolutionKind.Bundler,
      },
      host,
    );

    return program
      .getSemanticDiagnostics()
      .filter(
        ({ code, messageText }) =>
          missingExportCodes.includes(code) ||
          (code === 2307 &&
            flattenDiagnosticMessageText(messageText, ' ').includes("'.")),
      )
      .map(
        ({ file, messageText }) =>
          `${file?.fileName ?? ''}: ${flattenDiagnosticMessageText(messageText, ' ')}`,
      );
  }

  async function scaffoldControl(tree: UnitTestTree) {
    return new SchematicTestRunner(
      'scaffold',
      SCAFFOLD_COLLECTION_PATH,
    ).runSchematic('control', { key: 'slider', project: 'test-app' }, tree);
  }

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);

    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);
    appTree = await setupWorkspace(runner);
  });

  describe('project lookup', () => {
    it('fails when the named project is not in the workspace', async () => {
      await expect(runAdd({ project: 'does-not-exist' })).rejects.toThrow(
        'Project "does-not-exist" not found in workspace.',
      );
    });

    it('fails when no project is named and the workspace has no default', async () => {
      await expect(runner.runSchematic('ng-add', {}, appTree)).rejects.toThrow(
        'No project specified and no default project found.',
      );
    });
  });

  it('is idempotent: no duplicate import or provider call on re-run', async () => {
    const once = await runAdd();
    const scaffolded = await new SchematicTestRunner(
      'scaffold',
      SCAFFOLD_COLLECTION_PATH,
    ).runSchematic('control', { key: 'slider', project: 'test-app' }, once);
    const scaffoldedUnion = read(scaffolded, contentTypePath);
    const twice = await runner.runSchematic('ng-add', baseOptions, scaffolded);

    const sf = parseTS(read(twice, appConfigPath));

    expect(
      countNamedImport(sf, REACTIVE_FORMS_PACKAGE_NAME, 'provideFormbar'),
    ).toBe(1);
    expect(countCall(sf, 'provideFormbar')).toBe(1);
    expect(scaffoldedUnion).toContain('SliderControlConfig');
    expect(read(twice, contentTypePath)).toBe(scaffoldedUnion);
  });

  describe('Default', () => {
    it('imports provideFormbar from ngx-formbar', async () => {
      const tree = await runAdd();
      expect(exists(tree, appConfigPath)).toBe(true);

      const sf = parseTS(read(tree, appConfigPath));
      expect(
        hasNamedImport(sf, REACTIVE_FORMS_PACKAGE_NAME, 'provideFormbar'),
      ).toBe(true);
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

      expect(exists(tree, `${helperDir}/view-provider.ts`)).toBe(true);

      expect(exists(tree, formbarConfigPath)).toBe(true);
    });

    it('does not create obsolete host directive helper files', async () => {
      const tree = await runAdd();

      expect(exists(tree, `${helperDir}/block.host-directive.ts`)).toBe(false);
      expect(exists(tree, `${helperDir}/group.host-directive.ts`)).toBe(false);
      expect(exists(tree, `${helperDir}/control.host-directive.ts`)).toBe(
        false,
      );
    });

    it('uses schematics configuration file without values', async () => {
      const tree = await runAdd();

      const schematicsConfig = JSON.parse(
        read(tree, schematicsConfigPath),
      ) as NgxFormbarAutomationConfig;

      expect(schematicsConfig.registrationType).toBeUndefined();
      expect(schematicsConfig.controlRegistrationsPath).toBeUndefined();
      expect(schematicsConfig.viewProviderHelperPath).toBe(DEFAULT_HELPER_PATH);
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

    it('leaves the registrations to the token providers with provideInline', async () => {
      const tree = await runAdd({
        registrationStyle: 'token',
        provideInline: true,
      });
      const appConfig = parseTS(read(tree, appConfigPath));

      expect(importedFrom(appConfig, './registrations')).toEqual([
        'componentRegistrationsProvider',
        'validatorRegistrationsProvider',
        'asyncValidatorRegistrationsProvider',
      ]);
      expect(read(tree, appConfigPath)).toContain('provideFormbar()');
    });

    it('keeps one source of registrations with provideInline and without splitting', async () => {
      const tree = await runAdd({
        registrationStyle: 'token',
        provideInline: true,
        splitRegistrations: false,
      });
      const appConfig = read(tree, appConfigPath);

      expect(appConfig).toContain('provideFormbar()');
      expect(
        providersArrayContainsProviderObject(
          parseTS(appConfig),
          'NGX_FW_COMPONENT_REGISTRATIONS',
        ),
      ).toBe(true);
    });

    it('registers a scaffold with provideInline', async () => {
      const added = await runAdd({
        installSchematics: false,
        registrationStyle: 'token',
        provideInline: true,
      });
      const scaffolded = await new SchematicTestRunner(
        'scaffold',
        SCAFFOLD_COLLECTION_PATH,
      ).runSchematic('control', { key: 'slider', project: 'test-app' }, added);

      expect(
        read(scaffolded, `${registrations}/component-registrations.ts`),
      ).toContain('SliderControl');
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

    it.each<[string, Schema]>([
      ['all validators', {}],
      ['no sync validators', { includeSyncValidators: false }],
      ['no async validators', { includeAsyncValidators: false }],
      [
        'no validators',
        { includeSyncValidators: false, includeAsyncValidators: false },
      ],
    ])('writes a provider file that parses with %s', async (_, options) => {
      const tree = await runAdd({
        registrationStyle: 'config',
        splitRegistrations: false,
        ...options,
      });

      expect(syntaxErrors(read(tree, formbarConfigPath))).toEqual([]);
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

      expect(exists(tree, `${helperDir}/view-provider.ts`)).toBe(false);
    });

    it('uses the user provided helperPath', async () => {
      const helperPath = 'app/management/forms/helper';
      const finalPath = src(helperPath);
      const tree = await runAdd({
        useHelper: true,
        helperPath,
      });

      expect(exists(tree, `${finalPath}/view-provider.ts`)).toBe(true);
    });

    it.each([
      ['helperPath', '', `${helperDir}/view-provider.ts`],
      ['registrationsPath', '', `${registrations}/component-registrations.ts`],
      ['providerConfigPath', '', formbarConfigPath],
      ['providerConfigFileName', '', formbarConfigPath],
      ['providerConfigFileName', '.ts', formbarConfigPath],
      ['schematicsConfigPath', '', schematicsConfigPath],
      ['schematicConfigFileName', '', schematicsConfigPath],
      ['schematicConfigFileName', '.json', schematicsConfigPath],
    ])(
      'falls back to the default for %s set to "%s"',
      async (option, value, file) => {
        const tree = await runAdd({ [option]: value });

        expect(exists(tree, file)).toBe(true);
      },
    );

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

  describe('a folder whose kept index lacks what ng add seeds', () => {
    const sharedFolder = app('shared');
    const keptIndex = 'export const other = 1;\n';

    it.each<[string, Schema]>([
      ['token', {}],
      ['config', { registrationStyle: 'config' }],
      [
        'token without validators',
        {
          includeSyncValidators: false,
          includeAsyncValidators: false,
        },
      ],
      [
        'config in the root providers',
        {
          registrationStyle: 'config',
          provideInline: true,
        },
      ],
      ['token in the root providers', { provideInline: true }],
    ])('compiles with the registrations of %s style', async (_, options) => {
      appTree.create(`${sharedFolder}/index.ts`, keptIndex);

      const tree = await scaffoldControl(
        await runAdd({ registrationsPath: 'app/shared', ...options }),
      );

      expect(read(tree, `${sharedFolder}/index.ts`)).toBe(keptIndex);
      expect(brokenImports(tree)).toEqual([]);
    });

    it('imports only what the index lacks from the seeded file', async () => {
      appTree.create(
        `${sharedFolder}/index.ts`,
        "export { validatorRegistrations } from './validator-registrations';\n",
      );

      const tree = await runAdd({
        registrationsPath: 'app/shared',
        registrationStyle: 'config',
        provideInline: true,
      });
      const sf = parseTS(read(tree, appConfigPath));

      expect(importedFrom(sf, './shared')).toEqual(['validatorRegistrations']);
      expect(importedFrom(sf, './shared/component-registrations')).toEqual([
        'componentRegistrations',
      ]);
      expect(brokenImports(tree)).toEqual([]);
    });

    it('compiles with the helper in that folder', async () => {
      appTree.create(`${sharedFolder}/index.ts`, keptIndex);

      const tree = await scaffoldControl(
        await runAdd({ helperPath: 'app/shared' }),
      );

      expect(read(tree, app('slider/slider-control.ts'))).toContain(
        "from '../shared/view-provider'",
      );
      expect(brokenImports(tree)).toEqual([]);
    });

    it.each<[string, Schema]>([
      ['token', {}],
      ['config', { registrationStyle: 'config' }],
    ])(
      'compiles with registrations and helper in one new folder, in %s style',
      async (_, options) => {
        const tree = await scaffoldControl(
          await runAdd({
            registrationsPath: 'app/x',
            helperPath: 'app/x',
            ...options,
          }),
        );

        expect(read(tree, app('slider/slider-control.ts'))).toContain(
          "from '../x/view-provider'",
        );
        expect(brokenImports(tree)).toEqual([]);
      },
    );

    it('compiles when a re-run adds validators the seeded index lacks', async () => {
      appTree = await runAdd({
        registrationStyle: 'config',
        includeSyncValidators: false,
        includeAsyncValidators: false,
        provideInline: true,
      });
      appTree.overwrite(
        appConfigPath,
        read(appTree, appConfigPath)
          .replace(/import \{ componentRegistrations \}.*\n/, '')
          .replace(/provideFormbar\([\s\S]*?\)\s*\n/, ''),
      );

      const tree = await runAdd({
        registrationStyle: 'config',
        provideInline: true,
      });

      expect(brokenImports(tree)).toEqual([]);
    });
  });

  describe('registering a scaffold after ng-add', () => {
    it.each<[string, Schema, string, string?]>([
      [
        'a custom registrationsPath',
        { registrationsPath: 'app/management/forms' },
        src('app/management/forms/component-registrations.ts'),
      ],
      [
        'token registrations that are not split',
        { splitRegistrations: false },
        appConfigPath,
      ],
      [
        'config registrations in a custom provider file',
        {
          registrationStyle: 'config',
          splitRegistrations: false,
          providerConfigPath: 'app/providers',
        },
        app('providers/formbar.config.ts'),
      ],
      [
        'inline config registrations next to an existing formbar.config.ts',
        {
          registrationStyle: 'config',
          splitRegistrations: false,
          provideInline: true,
        },
        appConfigPath,
        formbarConfigPath,
      ],
    ])(
      'registers into the file ng-add set up for %s',
      async (_, options, file, existingFile) => {
        if (existingFile) {
          appTree.create(existingFile, 'export const formbarConfig = {};\n');
        }

        const added = await runAdd({ installSchematics: false, ...options });

        const scaffolded = await new SchematicTestRunner(
          'scaffold',
          SCAFFOLD_COLLECTION_PATH,
        ).runSchematic(
          'control',
          { key: 'slider', project: 'test-app' },
          added,
        );

        expect(read(scaffolded, file)).toContain('SliderControl');
      },
    );
  });

  describe('Schematics Config', () => {
    describe('useSchematicConfig is set to false', () => {
      it('does not create a schematics configuration file', async () => {
        const tree = await runAdd({
          useSchematicConfig: false,
        });

        expect(exists(tree, schematicsConfigPath)).toBe(false);
      });

      it('does not seed a content union no config points at', async () => {
        const tree = await runAdd({
          useSchematicConfig: false,
        });

        expect(exists(tree, contentTypePath)).toBe(false);
      });

      it('writes the schematics configuration as generator defaults in angular.json', async () => {
        const helperPath = 'app/management/forms/helper';
        const registrationsPath = 'app/management/forms/registrations';
        const tree = await runAdd({
          useSchematicConfig: false,
          registrationStyle: 'config',
          helperPath,
          registrationsPath,
        });

        const angularJson = JSON.parse(read(tree, 'angular.json')) as {
          projects: Record<
            string,
            { schematics: Record<string, Record<string, unknown>> }
          >;
        };
        const schematics = angularJson.projects['test-app'].schematics;
        const registrationsFile = `${registrationsPath}/component-registrations.ts`;

        for (const generator of ['control', 'group', 'block', 'array']) {
          expect(schematics[`@ngx-formbar/schematics:${generator}`]).toEqual({
            registrationType: 'config',
            controlRegistrationsPath: registrationsFile,
            viewProviderHelperPath: helperPath,
          });
        }
        expect(schematics['@ngx-formbar/schematics:register']).toEqual({
          registrationType: 'config',
          controlRegistrations: registrationsFile,
        });
        expect(
          Object.keys(schematics).filter((key) =>
            key.startsWith('@ngx-formbar/core:'),
          ),
        ).toEqual([]);
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
          `${registrationsPath}/component-registrations.ts`,
        );
        expect(schematicsConfig.viewProviderHelperPath).toBe(helperPath);
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

  describe('path options', () => {
    const sliderPath = app('slider/slider-control.ts');

    function pathForms(directory: string): [string, string, string][] {
      return [
        ['a plain path', directory, src(directory)],
        ['a "./" path', `./${directory}`, src(directory)],
        ['a "/" path', `/${directory}`, `/${directory}`],
        [
          'a path with the source root',
          src(directory).slice(1),
          src(directory),
        ],
        ['a "../" path', `../${directory}`, appRoot(directory)],
        [
          'a path climbing out of the source root',
          `${src().slice(1)}../${directory}`,
          appRoot(directory),
        ],
        [
          'a path climbing back into a source root spelled in full',
          `x/../${src(directory).slice(1)}`,
          src(src(directory).slice(1)),
        ],
      ];
    }

    async function addThenScaffold(options: Schema) {
      const added = await runAdd({ installSchematics: false, ...options });
      const [controlDefaults] = await generatorDefaults(added);

      return new SchematicTestRunner(
        'scaffold',
        SCAFFOLD_COLLECTION_PATH,
      ).runSchematic(
        'control',
        { ...controlDefaults, key: 'slider', project: 'test-app' },
        added,
      );
    }

    function expectHelperUsed(tree: UnitTestTree, directory: string) {
      const slider = parseTS(read(tree, sliderPath));

      expect(exists(tree, `${directory}/view-provider.ts`)).toBe(true);
      expect(
        hasNamedImport(
          slider,
          buildRelativePath(sliderPath, directory),
          'viewProviders',
        ),
      ).toBe(true);
      expect(hasNamedImport(slider, '@angular/forms', 'ControlContainer')).toBe(
        false,
      );
    }

    function expectRegistered(tree: UnitTestTree, directory: string) {
      expect(read(tree, `${directory}/component-registrations.ts`)).toContain(
        'SliderControl',
      );
      expect(
        hasNamedImport(
          parseTS(read(tree, appConfigPath)),
          buildRelativePath(appConfigPath, directory),
          'componentRegistrationsProvider',
        ),
      ).toBe(true);
    }

    it.each(pathForms('forms/config'))(
      'a scaffold finds a schematics configuration file placed with %s',
      async (_, schematicsConfigPath, directory) => {
        const helper = 'app/custom-helper';
        const registrationsDirectory = 'app/custom-registrations';

        const tree = await addThenScaffold({
          schematicsConfigPath,
          helperPath: helper,
          registrationsPath: registrationsDirectory,
        });

        expect(exists(tree, `${directory}/formbar-schematic.config.json`)).toBe(
          true,
        );
        expectHelperUsed(tree, src(helper));
        expectRegistered(tree, src(registrationsDirectory));
        expect(read(tree, contentTypePath)).toContain('SliderControlConfig');
      },
    );

    describe.each<[string, Schema]>([
      ['a schematics configuration file', {}],
      ['generator defaults', { useSchematicConfig: false }],
    ])('with the settings in %s', (_, settings) => {
      it.each(pathForms('forms/helper'))(
        'a scaffold uses a helper placed with %s',
        async (__, helperPath, directory) => {
          const tree = await addThenScaffold({ ...settings, helperPath });

          expectHelperUsed(tree, directory);
          expectRegistered(tree, registrations);
        },
      );

      it.each(pathForms('forms/registrations'))(
        'a scaffold registers into registrations placed with %s',
        async (__, registrationsPath, directory) => {
          const tree = await addThenScaffold({
            ...settings,
            registrationsPath,
          });

          expectHelperUsed(tree, helperDir);
          expectRegistered(tree, directory);
        },
      );

      it.each(pathForms('forms/provider'))(
        'a scaffold registers into a provider file placed with %s',
        async (__, providerConfigPath, directory) => {
          const providerFile = `${directory}/formbar.config.ts`;
          const tree = await addThenScaffold({
            ...settings,
            registrationStyle: 'config',
            splitRegistrations: false,
            providerConfigPath,
          });

          expect(read(tree, providerFile)).toContain('SliderControl');
          expect(
            hasNamedImport(
              parseTS(read(tree, appConfigPath)),
              buildRelativePath(appConfigPath, providerFile.slice(0, -3)),
              'formbarConfig',
            ),
          ).toBe(true);
        },
      );
    });

    it.each(pathForms('forms/registrations'))(
      'a provider file imports registrations placed with %s',
      async (_, registrationsPath, directory) => {
        const tree = await runAdd({
          registrationStyle: 'config',
          registrationsPath,
        });

        expect(
          hasNamedImport(
            parseTS(read(tree, formbarConfigPath)),
            buildRelativePath(formbarConfigPath, directory),
            'componentRegistrations',
          ),
        ).toBe(true);
      },
    );

    it.each([
      'registrationsPath',
      'providerConfigPath',
      'helperPath',
      'schematicsConfigPath',
    ])('names a %s above the workspace root', async (option) => {
      await expect(runAdd({ [option]: '../../../../x' })).rejects.toThrow(
        `"${option}" points outside the workspace root: ../../../../x`,
      );
    });

    it.each(['providerConfigFileName', 'schematicConfigFileName'])(
      'names a %s that climbs out of its directory',
      async (option) => {
        await expect(runAdd({ [option]: '../x' })).rejects.toThrow(
          `"${option}" must be a file name inside its directory: ../x`,
        );
      },
    );

    it('a scaffold uses a helper placed directly in the source root', async () => {
      const tree = await addThenScaffold({ helperPath: '.' });

      expectHelperUsed(tree, src().slice(0, -1));
    });

    it('a scaffold uses a helper placed directly at the workspace root', async () => {
      const tree = await addThenScaffold({ helperPath: '/' });

      expectHelperUsed(tree, '/');
    });
  });

  describe('in a source root named like the default directory', () => {
    const project = 'app-rooted';
    const appDir = (path: string) => `/app/app/${path}`;

    beforeEach(() => {
      appTree.overwrite(
        '/angular.json',
        read(appTree, 'angular.json').replace(
          '"projects": {',
          '"projects": { "app-rooted": { "projectType": "application", "root": "", "sourceRoot": "app" },',
        ),
      );
      appTree.create(appDir('app.config.ts'), read(appTree, appConfigPath));
    });

    async function addThenScaffold(options: Schema = {}) {
      const added = await runAdd({
        installSchematics: false,
        project,
        ...options,
      });
      const [controlDefaults] = await generatorDefaults(added, project);

      return new SchematicTestRunner(
        'scaffold',
        SCAFFOLD_COLLECTION_PATH,
      ).runSchematic(
        'control',
        { ...controlDefaults, key: 'slider', project },
        added,
      );
    }

    it('places the defaults inside the source root and registers a scaffold', async () => {
      const tree = await addThenScaffold();

      expect(tree.getDir('/app/registrations').subfiles).toEqual([]);
      expect(exists(tree, appDir('formbar-schematic.config.json'))).toBe(true);
      expect(read(tree, appDir('slider/slider-control.ts'))).toContain(
        'SliderControl',
      );
      expect(
        read(tree, appDir('registrations/component-registrations.ts')),
      ).toContain('SliderControl');
      expect(read(tree, appDir('types/content.type.ts'))).toContain(
        'SliderControlConfig',
      );
      expect(
        hasNamedImport(
          parseTS(read(tree, appDir('app.config.ts'))),
          './registrations',
          'componentRegistrationsProvider',
        ),
      ).toBe(true);
    });

    it('writes schema.type "/"-rooted, as the plain path would read as inside the source root', async () => {
      const tree = await runAdd({ installSchematics: false, project });

      expect(read(tree, appDir('formbar-schematic.config.json'))).toContain(
        '"type": "/app/app/types/content.type.ts#AppContent"',
      );
    });

    describe.each<[string, Schema]>([
      ['a schematics configuration file', {}],
      ['generator defaults', { useSchematicConfig: false }],
    ])('with the settings in %s', (_, settings) => {
      it('uses the default helper', async () => {
        const tree = await addThenScaffold({ ...settings, useHelper: true });

        expect(exists(tree, appDir('shared/helper/view-provider.ts'))).toBe(
          true,
        );
        expect(
          hasNamedImport(
            parseTS(read(tree, appDir('slider/slider-control.ts'))),
            '../shared/helper',
            'viewProviders',
          ),
        ).toBe(true);
      });

      it('registers into the default provider file', async () => {
        const tree = await addThenScaffold({
          ...settings,
          registrationStyle: 'config',
          splitRegistrations: false,
        });

        expect(read(tree, appDir('formbar.config.ts'))).toContain(
          'SliderControl',
        );
      });

      it('registers into the app config', async () => {
        const tree = await addThenScaffold({
          ...settings,
          splitRegistrations: false,
        });

        expect(read(tree, appDir('app.config.ts'))).toContain('SliderControl');
      });

      it('reads a supplied path as already inside the source root', async () => {
        const tree = await addThenScaffold({
          ...settings,
          registrationsPath: 'app/registrations',
        });

        expect(
          read(tree, '/app/registrations/component-registrations.ts'),
        ).toContain('SliderControl');
      });
    });

    it('registers through a config with a custom name in the default directory', async () => {
      const tree = await addThenScaffold({
        schematicConfigFileName: 'custom.json',
      });

      expect(exists(tree, appDir('custom.json'))).toBe(true);
      expect(
        read(tree, appDir('registrations/component-registrations.ts')),
      ).toContain('SliderControl');
    });
  });

  describe.each(['src/', './src'])(
    'in a source root spelled %s',
    (sourceRoot) => {
      it('reads a path that already starts with the source root as lying in it', async () => {
        appTree.overwrite(
          '/angular.json',
          read(appTree, 'angular.json').replace(
            '"projects": {',
            `"projects": { "spelled": { "projectType": "application", "root": "", "sourceRoot": "${sourceRoot}" },`,
          ),
        );
        appTree.create('/src/app/app.config.ts', read(appTree, appConfigPath));

        const tree = await runAdd({
          installSchematics: false,
          project: 'spelled',
          registrationsPath: 'src/forms',
        });

        expect(exists(tree, '/src/forms/component-registrations.ts')).toBe(
          true,
        );
        expect(tree.getDir('/src/src').subdirs).toEqual([]);
      });
    },
  );

  describe('finding the root providers from the main file', () => {
    const standaloneMain = (configImport: string) =>
      [
        `import { bootstrapApplication } from '@angular/platform-browser';`,
        `import { App } from './app/app';`,
        `import { appConfig } from '${configImport}';`,
        `bootstrapApplication(App, appConfig);`,
        ``,
      ].join('\n');
    const mainWithCall = (call: string) =>
      [
        `import { bootstrapApplication } from '@angular/platform-browser';`,
        `import { App } from './app/app';`,
        call,
        ``,
      ].join('\n');
    const moduleMain = [
      `import { platformBrowser } from '@angular/platform-browser';`,
      `import { AppModule } from './app/app.module';`,
      `platformBrowser().bootstrapModule(AppModule);`,
      ``,
    ].join('\n');
    const appModule = (metadata: string) =>
      [
        `import { NgModule } from '@angular/core';`,
        `@NgModule(${metadata})`,
        `export class AppModule {}`,
        ``,
      ].join('\n');
    const config = `export const appConfig = { providers: [] };\n`;
    const decoyConfig = `export const decoy = { providers: [] };\nexport const appConfig = { providers: [] };\n`;
    const library: JsonObject = {
      lib: {
        projectType: 'library',
        root: 'libs/lib',
        sourceRoot: 'libs/lib/src',
        architect: {},
      },
    };
    const aliasTsConfig = JSON.stringify({
      compilerOptions: {
        paths: {
          '@config': ['./src/bootstrap/config.ts'],
          '@shared': ['./src/bootstrap/index.ts'],
          '@shared/*': ['./src/bootstrap/*'],
        },
      },
    });

    function workspace(
      sourceRoot: string,
      files: Record<string, string>,
      build: JsonObject | null = {
        builder: '@angular/build:application',
        options: {},
      },
      projects: JsonObject = {},
    ) {
      const tree = new UnitTestTree(Tree.empty());

      tree.create(
        '/angular.json',
        JSON.stringify({
          version: 1,
          projects: {
            a: {
              projectType: 'application',
              root: '',
              sourceRoot,
              architect: build ? { build } : {},
            },
            ...projects,
          },
        }),
      );
      tree.create('/package.json', JSON.stringify({ name: 'w' }));
      Object.entries(files).forEach(([path, content]) => {
        tree.create(path, content);
      });

      return tree;
    }

    async function add(tree: UnitTestTree, options: Schema = {}) {
      return runner.runSchematic(
        'ng-add',
        { project: 'a', installSchematics: false, ...options },
        tree,
      );
    }

    async function addThenScaffold(tree: UnitTestTree, options: Schema = {}) {
      const added = await add(tree, options);
      const [controlDefaults] = await generatorDefaults(added, 'a');

      return new SchematicTestRunner(
        'scaffold',
        SCAFFOLD_COLLECTION_PATH,
      ).runSchematic(
        'control',
        { ...controlDefaults, key: 'slider', project: 'a' },
        added,
      );
    }

    async function warningsOf(tree: UnitTestTree) {
      const warnings: string[] = [];
      const subscription = runner.logger.subscribe((entry) => {
        if (entry.level === 'warn') {
          warnings.push(entry.message);
        }
      });

      await add(tree);
      subscription.unsubscribe();

      return warnings;
    }

    interface Layout {
      name: string;
      sourceRoot: string;
      files: Record<string, string>;
      root: string;
      readsInlineRegistrations: boolean;
    }

    const layouts: Layout[] = [
      {
        name: 'src/app/app.config.ts',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': standaloneMain('./app/app.config'),
          '/src/app/app.config.ts': config,
        },
        root: '/src/app/app.config.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'source root app with /app/app.config.ts',
        sourceRoot: 'app',
        files: {
          '/app/main.ts': standaloneMain('./app.config'),
          '/app/app.config.ts': config,
        },
        root: '/app/app.config.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'source root app with /app/app/app.config.ts',
        sourceRoot: 'app',
        files: {
          '/app/main.ts': standaloneMain('./app/app.config'),
          '/app/app/app.config.ts': config,
        },
        root: '/app/app/app.config.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'src/app.config.ts',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': standaloneMain('./app.config'),
          '/src/app.config.ts': config,
        },
        root: '/src/app.config.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'src/app/core/app.config.ts',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': standaloneMain('./app/core/app.config'),
          '/src/app/core/app.config.ts': config,
        },
        root: '/src/app/core/app.config.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'a renamed src/app/config.ts',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': standaloneMain('./app/config'),
          '/src/app/config.ts': config,
        },
        root: '/src/app/config.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'src/bootstrap/config.ts beside a decoy src/app/app.config.ts',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': standaloneMain('./bootstrap/config'),
          '/src/bootstrap/config.ts': config,
          '/src/app/app.config.ts': config,
        },
        root: '/src/bootstrap/config.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'a config variable declared in main.ts',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': mainWithCall(
            `const appConfig = { providers: [] };\nbootstrapApplication(App, appConfig);`,
          ),
        },
        root: '/src/main.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'an inline object',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': mainWithCall(
            `bootstrapApplication(App, { providers: [] });`,
          ),
        },
        root: '/src/main.ts',
        readsInlineRegistrations: false,
      },
      {
        name: 'no config',
        sourceRoot: 'src',
        files: { '/src/main.ts': mainWithCall(`bootstrapApplication(App);`) },
        root: '/src/main.ts',
        readsInlineRegistrations: false,
      },
      {
        name: 'an NgModule',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': moduleMain,
          '/src/app/app.module.ts': appModule(`{ providers: [] }`),
        },
        root: '/src/app/app.module.ts',
        readsInlineRegistrations: false,
      },
      {
        name: 'a barrel holding the config',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': standaloneMain('./config'),
          '/src/config/index.ts': config,
        },
        root: '/src/config/index.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'a barrel re-exporting the config by name',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': standaloneMain('./config'),
          '/src/config/index.ts': `export { appConfig } from './app.config';\n`,
          '/src/config/app.config.ts': config,
        },
        root: '/src/config/app.config.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'a barrel re-exporting the config with export *',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': standaloneMain('./config'),
          '/src/config/index.ts': `export * from './other';\nexport * from './app.config';\n`,
          '/src/config/other.ts': `export const other = { providers: [] };\n`,
          '/src/config/app.config.ts': config,
        },
        root: '/src/config/app.config.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'a config renamed on export and import',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': mainWithCall(
            `import { renamed as cfg } from './app/app.config';\nbootstrapApplication(App, cfg);`,
          ),
          '/src/app/app.config.ts': `const local = { providers: [] };\nexport { local as renamed };\n`,
        },
        root: '/src/app/app.config.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'a config variable exported as default',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': mainWithCall(
            `import cfg from './app/app.config';\nbootstrapApplication(App, cfg);`,
          ),
          '/src/app/app.config.ts': `const local = { providers: [] };\nexport default local;\n`,
        },
        root: '/src/app/app.config.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'a config typed with satisfies',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': standaloneMain('./app/app.config'),
          '/src/app/app.config.ts': `export const appConfig = { providers: [] } satisfies object;\n`,
        },
        root: '/src/app/app.config.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'a config imported through a path alias',
        sourceRoot: 'src',
        files: {
          '/tsconfig.json': aliasTsConfig,
          '/src/main.ts': standaloneMain('@config'),
          '/src/bootstrap/config.ts': config,
          '/src/app/app.config.ts': config,
        },
        root: '/src/bootstrap/config.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'a config imported through a path alias in an extended tsconfig',
        sourceRoot: 'src',
        files: {
          '/tsconfig.json': aliasTsConfig,
          '/tsconfig.app.json': JSON.stringify({ extends: './tsconfig.json' }),
          '/src/main.ts': standaloneMain('@shared/config'),
          '/src/bootstrap/config.ts': config,
        },
        root: '/src/bootstrap/config.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'a config imported through a path alias to a barrel',
        sourceRoot: 'src',
        files: {
          '/tsconfig.json': aliasTsConfig,
          '/src/main.ts': standaloneMain('@shared'),
          '/src/bootstrap/index.ts': `export * from './config';\n`,
          '/src/bootstrap/config.ts': config,
        },
        root: '/src/bootstrap/config.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'a config imported from a package',
        sourceRoot: 'src',
        files: { '/src/main.ts': standaloneMain('@acme/config') },
        root: '/src/main.ts',
        readsInlineRegistrations: false,
      },
      {
        name: 'a call to a local function',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': mainWithCall(
            `function makeConfig() { return { providers: [] }; }\nbootstrapApplication(App, makeConfig());`,
          ),
        },
        root: '/src/main.ts',
        readsInlineRegistrations: false,
      },
      {
        name: 'a call to an imported function',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': mainWithCall(
            `import { makeConfig } from './make-config';\nbootstrapApplication(App, makeConfig());`,
          ),
          '/src/make-config.ts': `export const makeConfig = () => ({ providers: [] });\n`,
        },
        root: '/src/main.ts',
        readsInlineRegistrations: false,
      },
      {
        name: 'a config variable holding a call',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': standaloneMain('./app/app.config'),
          '/src/app/app.config.ts': `const make = () => ({ providers: [] });\nexport const appConfig = make();\n`,
        },
        root: '/src/main.ts',
        readsInlineRegistrations: false,
      },
      {
        name: 'a config variable without a providers array',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': standaloneMain('./app/app.config'),
          '/src/app/app.config.ts': `const shared = [];\nexport const appConfig = { providers: shared };\n`,
        },
        root: '/src/main.ts',
        readsInlineRegistrations: false,
      },
      {
        name: 'an inline object without a providers array',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': mainWithCall(
            `const shared = [];\nbootstrapApplication(App, { providers: shared });`,
          ),
        },
        root: '/src/main.ts',
        readsInlineRegistrations: false,
      },
      {
        name: 'an inline object spreading another config',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': mainWithCall(
            `const base = { providers: [] };\nbootstrapApplication(App, { ...base });`,
          ),
        },
        root: '/src/main.ts',
        readsInlineRegistrations: false,
      },
      {
        name: 'a decoy variable above the config',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': standaloneMain('./app/app.config'),
          '/src/app/app.config.ts': decoyConfig,
        },
        root: '/src/app/app.config.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'a decoy variable in the same statement as the config',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': standaloneMain('./app/app.config'),
          '/src/app/app.config.ts': `export const decoy = { providers: [] }, appConfig = { providers: [] };\n`,
        },
        root: '/src/app/app.config.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'a decoy variable without a providers array',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': standaloneMain('./app/app.config'),
          '/src/app/app.config.ts': `const shared = [];\nexport const decoy = { providers: shared };\nexport const appConfig = { providers: [] };\n`,
        },
        root: '/src/app/app.config.ts',
        readsInlineRegistrations: true,
      },
      {
        name: 'a decoy variable in main.ts',
        sourceRoot: 'src',
        files: {
          '/src/main.ts': mainWithCall(
            `const decoy = { providers: [] };\nconst appConfig = { providers: [] };\nbootstrapApplication(App, appConfig);`,
          ),
        },
        root: '/src/main.ts',
        readsInlineRegistrations: true,
      },
    ];

    function countOf(text: string, part: string) {
      return text.split(part).length - 1;
    }

    describe.each(layouts)('with $name', (layout) => {
      const sourceDirectory = `/${layout.sourceRoot}/app`;
      const splitFile = `${sourceDirectory}/registrations/component-registrations.ts`;
      const providerFile = `${sourceDirectory}/formbar.config.ts`;

      const styles: [string, Schema, string][] = [
        ['split token registrations', {}, splitFile],
        [
          'split token registrations without a schematics configuration file',
          { useSchematicConfig: false },
          splitFile,
        ],
        [
          'inline token registrations',
          { splitRegistrations: false },
          layout.root,
        ],
        [
          'inline token registrations without a schematics configuration file',
          { splitRegistrations: false, useSchematicConfig: false },
          layout.root,
        ],
        [
          'split config registrations',
          { registrationStyle: 'config' },
          splitFile,
        ],
        [
          'config registrations in the provider file',
          { registrationStyle: 'config', splitRegistrations: false },
          providerFile,
        ],
        [
          'config registrations inside provideFormbar',
          {
            registrationStyle: 'config',
            splitRegistrations: false,
            provideInline: true,
          },
          layout.readsInlineRegistrations ? layout.root : splitFile,
        ],
      ];

      it.each(styles)(
        '%s land where a scaffold registers, also after a re-run',
        async (_, options, registrationsFile) => {
          const scaffolded = await addThenScaffold(
            workspace(layout.sourceRoot, layout.files),
            options,
          );

          expect(
            countCall(parseTS(read(scaffolded, layout.root)), 'provideFormbar'),
          ).toBe(1);
          expect(read(scaffolded, registrationsFile)).toContain(
            'SliderControl',
          );
          expect(
            exists(scaffolded, `${sourceDirectory}/slider/slider-control.ts`),
          ).toBe(true);

          Object.entries(layout.files)
            .filter(
              ([path]) => path !== layout.root && !path.endsWith('main.ts'),
            )
            .forEach(([path, content]) => {
              expect(read(scaffolded, path)).toBe(content);
            });

          const rerun = await add(scaffolded, options);

          expect(read(rerun, layout.root)).toBe(read(scaffolded, layout.root));
          expect(read(rerun, registrationsFile)).toBe(
            read(scaffolded, registrationsFile),
          );
        },
      );

      it('keeps one provider for each inline token', async () => {
        const once = await add(workspace(layout.sourceRoot, layout.files), {
          splitRegistrations: false,
        });
        const twice = await add(once, { splitRegistrations: false });
        const root = read(twice, layout.root);

        expect(countOf(root, 'provide: NGX_FW_COMPONENT_REGISTRATIONS')).toBe(
          1,
        );
        expect(countOf(root, 'provide: NGX_FW_VALIDATOR_REGISTRATIONS')).toBe(
          1,
        );
        expect(
          countOf(root, 'provide: NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS'),
        ).toBe(1);
      });
    });

    describe.each<[string, JsonObject | null, string]>([
      [
        '@nx/angular:application',
        {
          builder: '@nx/angular:application',
          options: { browser: 'src/boot.ts' },
        },
        '/src/boot.ts',
      ],
      [
        'a custom esbuild builder',
        {
          builder: '@angular-builders/custom-esbuild:application',
          options: { browser: 'src/boot.ts' },
        },
        '/src/boot.ts',
      ],
      [
        'a "main" option',
        {
          builder: '@nx/angular:webpack-browser',
          options: { main: 'src/boot.ts' },
        },
        '/src/boot.ts',
      ],
      [
        'neither option',
        { builder: '@angular/build:application', options: {} },
        '/src/main.ts',
      ],
      ['no build target', null, '/src/main.ts'],
    ])('with %s', (_, build, main) => {
      it('follows the main file to its config', async () => {
        const tree = await add(
          workspace(
            'src',
            {
              [main]: standaloneMain('./moved/config'),
              '/src/moved/config.ts': config,
            },
            build,
          ),
        );

        expect(
          countCall(
            parseTS(read(tree, '/src/moved/config.ts')),
            'provideFormbar',
          ),
        ).toBe(1);
      });

      it('adds to an inline object in the main file', async () => {
        const tree = await add(
          workspace(
            'src',
            {
              [main]: mainWithCall(
                `bootstrapApplication(App, { providers: [] });`,
              ),
            },
            build,
          ),
        );

        expect(countCall(parseTS(read(tree, main)), 'provideFormbar')).toBe(1);
      });

      it('adds to the root NgModule', async () => {
        const tree = await add(
          workspace(
            'src',
            {
              [main]: moduleMain,
              '/src/app/app.module.ts': appModule(`{ providers: [] }`),
            },
            build,
          ),
        );

        expect(
          countCall(
            parseTS(read(tree, '/src/app/app.module.ts')),
            'provideFormbar',
          ),
        ).toBe(1);
      });
    });

    it('adds a providers array to an NgModule without one', async () => {
      const tree = await addThenScaffold(
        workspace('src', {
          '/src/main.ts': moduleMain,
          '/src/app/app.module.ts': appModule(`{ declarations: [] }`),
        }),
        { splitRegistrations: false },
      );
      const moduleFile = read(tree, '/src/app/app.module.ts');

      expect(
        getDecoratorArrayProp(parseTS(moduleFile), 'NgModule', 'providers'),
      ).toBeDefined();
      expect(countCall(parseTS(moduleFile), 'provideFormbar')).toBe(1);
      expect(moduleFile).toContain('declarations: []');
      expect(moduleFile).toContain('SliderControl');
    });

    it('adds to the config object of mergeApplicationConfig', async () => {
      const main = mainWithCall(
        `import { mergeApplicationConfig } from '@angular/core';\nimport { base } from './base';\nbootstrapApplication(App, mergeApplicationConfig(base, { providers: [] }));`,
      );
      const tree = await addThenScaffold(
        workspace('src', { '/src/main.ts': main, '/src/base.ts': config }),
        { splitRegistrations: false },
      );
      const rerun = await add(tree, { splitRegistrations: false });

      expect(read(rerun, '/src/main.ts')).toContain('SliderControl');
      expect(
        countCall(parseTS(read(rerun, '/src/main.ts')), 'provideFormbar'),
      ).toBe(1);
      expect(read(rerun, '/src/base.ts')).toBe(config);
    });

    it('adds a config object to mergeApplicationConfig without one', async () => {
      const main = mainWithCall(
        `import { mergeApplicationConfig } from '@angular/core';\nimport { base } from './base';\nbootstrapApplication(App, mergeApplicationConfig(base));`,
      );
      const tree = await add(
        workspace('src', { '/src/main.ts': main, '/src/base.ts': config }),
      );
      const rerun = await add(tree);

      expect(read(rerun, '/src/main.ts')).toBe(read(tree, '/src/main.ts'));
      expect(
        countCall(parseTS(read(rerun, '/src/main.ts')), 'provideFormbar'),
      ).toBe(1);
    });

    it('follows an aliased bootstrapApplication import', async () => {
      const tree = await add(
        workspace('src', {
          '/src/main.ts': `import { bootstrapApplication as boot } from '@angular/platform-browser';\nimport { App } from './app/app';\nboot(App);\n`,
        }),
      );

      expect(
        countCall(parseTS(read(tree, '/src/main.ts')), 'provideFormbar'),
      ).toBe(1);
    });

    it.each<[string, Record<string, string>, string]>([
      [
        'a local function',
        {
          '/src/main.ts': mainWithCall(
            `const makeConfig = () => ({ providers: [] });\nbootstrapApplication(App, makeConfig());`,
          ),
        },
        'makeConfig()',
      ],
      [
        'an imported function',
        {
          '/src/main.ts': mainWithCall(
            `import { makeConfig } from './make-config';\nbootstrapApplication(App, makeConfig());`,
          ),
          '/src/make-config.ts': `export const makeConfig = () => ({ providers: [] });\n`,
        },
        'makeConfig()',
      ],
      [
        'a variable holding a call',
        {
          '/src/main.ts': standaloneMain('./app/app.config'),
          '/src/app/app.config.ts': `export const appConfig = make();\n`,
        },
        'appConfig',
      ],
    ])(
      'wraps a config from %s once with mergeApplicationConfig',
      async (_, files, config) => {
        const once = await add(workspace('src', files));
        const twice = await add(once);
        const main = read(twice, '/src/main.ts');

        expect(main).toBe(read(once, '/src/main.ts'));
        expect(main).toContain(
          `bootstrapApplication(App, mergeApplicationConfig(${config}, {`,
        );
        expect(countOf(main, 'mergeApplicationConfig(')).toBe(1);
        expect(
          countNamedImport(
            parseTS(main),
            '@angular/core',
            'mergeApplicationConfig',
          ),
        ).toBe(1);
        expect(countCall(parseTS(main), 'provideFormbar')).toBe(1);
      },
    );

    it('adds the import to an existing @angular/core import when wrapping', async () => {
      const tree = await add(
        workspace('src', {
          '/src/main.ts': mainWithCall(
            `import { enableProdMode } from '@angular/core';\nenableProdMode();\nbootstrapApplication(App, makeConfig());`,
          ),
        }),
      );

      expect(countOf(read(tree, '/src/main.ts'), `from '@angular/core'`)).toBe(
        1,
      );
      expect(
        hasNamedImport(
          parseTS(read(tree, '/src/main.ts')),
          '@angular/core',
          'mergeApplicationConfig',
        ),
      ).toBe(true);
    });

    it.each([
      [
        'above the config',
        '/src/app/app.config.ts',
        decoyConfig,
        'export const decoy = { providers: [] };',
      ],
      [
        'in the same statement as the config',
        '/src/app/app.config.ts',
        `export const decoy = { providers: [] }, appConfig = { providers: [] };\n`,
        'decoy = { providers: [] }',
      ],
      [
        'in main.ts',
        '/src/main.ts',
        mainWithCall(
          `const decoy = { providers: [] };\nconst appConfig = { providers: [] };\nbootstrapApplication(App, appConfig);`,
        ),
        'const decoy = { providers: [] };',
      ],
    ])('leaves a decoy variable %s alone', async (_, file, content, decoy) => {
      const files = {
        '/src/main.ts': standaloneMain('./app/app.config'),
        [file]: content,
      };
      const tree = await addThenScaffold(workspace('src', files), {
        registrationStyle: 'config',
        splitRegistrations: false,
        provideInline: true,
      });

      expect(read(tree, file)).toContain(decoy);
      expect(read(tree, file)).toContain('SliderControl');
    });

    it('edits the variable the bootstrap call references over one named appConfig', async () => {
      const tree = await add(
        workspace('src', {
          '/src/main.ts': mainWithCall(
            `import { real } from './app/app.config';\nbootstrapApplication(App, real);`,
          ),
          '/src/app/app.config.ts': `export const appConfig = { providers: [] };\nexport const real = { providers: [] };\n`,
        }),
      );

      expect(read(tree, '/src/app/app.config.ts')).toContain(
        'export const appConfig = { providers: [] };',
      );
      expect(
        countCall(
          parseTS(read(tree, '/src/app/app.config.ts')),
          'provideFormbar',
        ),
      ).toBe(1);
    });

    describe('resolving the config variable through the compiler', () => {
      it('takes the re-exported config over an unexported local of a barrel', async () => {
        const tree = await add(
          workspace('src', {
            '/src/main.ts': standaloneMain('./cfg'),
            '/src/cfg/index.ts': `const appConfig = { providers: [] };\nexport const unrelated = appConfig;\nexport * from './real';\n`,
            '/src/cfg/real.ts': config,
          }),
        );

        expect(read(tree, '/src/cfg/real.ts')).toContain('provideFormbar(');
        expect(read(tree, '/src/cfg/index.ts')).not.toContain(
          'provideFormbar(',
        );
      });

      it('wraps a parameter shadowing a config variable', async () => {
        const tree = await add(
          workspace('src', {
            '/src/main.ts': mainWithCall(
              `const cfg = { providers: [] };\nfunction run(cfg) {\n  return bootstrapApplication(App, cfg);\n}\nrun(make());`,
            ),
          }),
        );

        expect(read(tree, '/src/main.ts')).toContain(
          'const cfg = { providers: [] };',
        );
        expect(read(tree, '/src/main.ts')).toContain(
          'bootstrapApplication(App, mergeApplicationConfig(cfg, {',
        );
      });

      it('wraps a config variable declared inside a function', async () => {
        const tree = await add(
          workspace('src', {
            '/src/main.ts': mainWithCall(
              `async function run() {\n  const cfg = { providers: [] };\n  await bootstrapApplication(App, cfg);\n}\nrun();`,
            ),
          }),
        );

        expect(read(tree, '/src/main.ts')).toContain(
          'bootstrapApplication(App, mergeApplicationConfig(cfg, {',
        );
      });

      it('follows a default export through a re-export', async () => {
        const tree = await add(
          workspace('src', {
            '/src/main.ts': mainWithCall(
              `import cfg from './cfg';\nbootstrapApplication(App, cfg);`,
            ),
            '/src/cfg/index.ts': `export { default } from './real';\n`,
            '/src/cfg/real.ts': `const local = { providers: [] };\nexport default local;\n`,
          }),
        );

        expect(read(tree, '/src/cfg/real.ts')).toContain('provideFormbar(');
      });
    });

    describe('finding the root NgModule', () => {
      const mainFor = (specifier: string) =>
        [
          `import { platformBrowser } from '@angular/platform-browser';`,
          `import { AppModule } from '${specifier}';`,
          `platformBrowser().bootstrapModule(AppModule);`,
          ``,
        ].join('\n');

      it.each<[string, Record<string, string>, string]>([
        [
          'a barrel',
          {
            '/src/main.ts': mainFor('./app'),
            '/src/app/index.ts': `export * from './app.module';\n`,
            '/src/app/app.module.ts': appModule(`{ providers: [] }`),
          },
          '/src/app/app.module.ts',
        ],
        [
          'a path alias',
          {
            '/tsconfig.json': JSON.stringify({
              compilerOptions: {
                paths: { '@app/module': ['./src/app/app.module.ts'] },
              },
            }),
            '/src/main.ts': mainFor('@app/module'),
            '/src/app/app.module.ts': appModule(`{ providers: [] }`),
          },
          '/src/app/app.module.ts',
        ],
        [
          'a declaration in main.ts',
          {
            '/src/main.ts': `import { NgModule } from '@angular/core';\nimport { platformBrowser } from '@angular/platform-browser';\n@NgModule({ providers: [] })\nclass AppModule {}\nplatformBrowser().bootstrapModule(AppModule);\n`,
          },
          '/src/main.ts',
        ],
      ])('follows %s to the module', async (_, files, moduleFile) => {
        const tree = await add(workspace('src', files));

        expect(read(tree, moduleFile)).toContain('provideFormbar(');
      });

      it('edits the bootstrapped one of two NgModules in a file', async () => {
        const tree = await add(
          workspace('src', {
            '/src/main.ts': mainFor('./app/app.module'),
            '/src/app/app.module.ts': `import { NgModule } from '@angular/core';\n@NgModule({ providers: [] })\nexport class HelperModule {}\n@NgModule({ providers: [] })\nexport class AppModule {}\n`,
          }),
        );
        const moduleFile = read(tree, '/src/app/app.module.ts');

        expect(moduleFile.indexOf('provideFormbar(')).toBeGreaterThan(
          moduleFile.indexOf('class HelperModule'),
        );
      });

      it('fails naming a root NgModule outside the project', async () => {
        await expect(
          add(
            workspace(
              'src',
              {
                '/tsconfig.json': JSON.stringify({
                  compilerOptions: {
                    paths: { '@lib': ['./libs/lib/src/index.ts'] },
                  },
                }),
                '/src/main.ts': mainFor('@lib'),
                '/libs/lib/src/index.ts': appModule(`{ providers: [] }`),
              },
              undefined,
              library,
            ),
          ),
        ).rejects.toThrow(
          'Could not edit the root NgModule "AppModule" bootstrapped in /src/main.ts',
        );
      });

      it.each([
        [
          'an identifier',
          `const SHARED = [];\n`,
          `{ providers: SHARED }`,
          '[SHARED, ',
        ],
        [
          'a shorthand',
          `const providers = [];\n`,
          `{ providers }`,
          'providers: [providers, ',
        ],
      ])(
        'keeps providers given as %s in an array',
        async (_, declaration, metadata, expected) => {
          const files = {
            '/src/main.ts': mainFor('./app/app.module'),
            '/src/app/app.module.ts': `${declaration}${appModule(metadata)}`,
          };
          const once = await add(workspace('src', files));
          const twice = await add(once);
          const moduleFile = read(twice, '/src/app/app.module.ts');

          expect(moduleFile.replace(/\s+/g, ' ')).toContain(expected);
          expect(moduleFile).toBe(read(once, '/src/app/app.module.ts'));
          expect(syntaxErrors(moduleFile)).toEqual([]);
        },
      );

      it('fails on metadata spreading another object', async () => {
        await expect(
          add(
            workspace('src', {
              '/src/main.ts': mainFor('./app/app.module'),
              '/src/app/app.module.ts': `const base = {};\n${appModule(`{ ...base }`)}`,
            }),
          ),
        ).rejects.toThrow('metadata spreads another object');
      });
    });

    describe('following imports to the bootstrap call', () => {
      const bootstrapFile = [
        `import { bootstrapApplication } from '@angular/platform-browser';`,
        `import { App } from './app/app';`,
        `import { real } from './real';`,
        `bootstrapApplication(App, real);`,
        ``,
      ].join('\n');
      const decoy = `export const decoy = { providers: [] };\n`;

      it.each([
        ['a dynamic import', `import('./bootstrap').catch(console.error);\n`],
        ['a static import', `import './bootstrap';\n`],
      ])('follows %s from the main file', async (_, main) => {
        const tree = await add(
          workspace('src', {
            '/src/main.ts': main,
            '/src/bootstrap.ts': bootstrapFile,
            '/src/real.ts': `export const real = { providers: [] };\n`,
            '/src/app/app.config.ts': decoy,
          }),
        );

        expect(read(tree, '/src/real.ts')).toContain('provideFormbar(');
        expect(read(tree, '/src/app/app.config.ts')).toBe(decoy);
      });

      it('wraps the config in the followed file, not the main file', async () => {
        const main = `import('./bootstrap');\n`;
        const tree = await add(
          workspace('src', {
            '/src/main.ts': main,
            '/src/bootstrap.ts': `import { bootstrapApplication } from '@angular/platform-browser';\nbootstrapApplication(App, make());\n`,
          }),
        );

        expect(read(tree, '/src/main.ts')).toBe(main);
        expect(read(tree, '/src/bootstrap.ts')).toContain(
          'mergeApplicationConfig(make(), {',
        );
      });

      it('finds a namespace call', async () => {
        const tree = await add(
          workspace('src', {
            '/src/main.ts': `import * as pb from '@angular/platform-browser';\nimport { appConfig } from './cfg';\npb.bootstrapApplication(App, appConfig);\n`,
            '/src/cfg.ts': config,
            '/src/app/app.config.ts': decoy,
          }),
        );

        expect(read(tree, '/src/cfg.ts')).toContain('provideFormbar(');
      });

      it('does not take a local function of that name for the bootstrap call', async () => {
        const main = `function bootstrapApplication() {}\nbootstrapApplication();\n`;
        const tree = await add(
          workspace('src', {
            '/src/main.ts': main,
            '/src/app/app.config.ts': config,
          }),
        );

        expect(read(tree, '/src/main.ts')).toBe(main);
        expect(read(tree, '/src/app/app.config.ts')).toContain(
          'provideFormbar(',
        );
      });

      it('warns naming the file it falls back to', async () => {
        const warnings = await warningsOf(
          workspace('src', {
            '/src/main.ts': `export {};\n`,
            '/src/app/app.config.ts': config,
          }),
        );

        expect(warnings).toContain(
          'Found no bootstrap call from /src/main.ts. Using /src/app/app.config.ts for the root providers.',
        );
      });

      it('warns about a main file with several bootstrap calls', async () => {
        const warnings = await warningsOf(
          workspace('src', {
            '/src/main.ts': mainWithCall(
              `if (a) {\n  bootstrapApplication(App);\n} else {\n  bootstrapApplication(Other);\n}`,
            ),
          }),
        );

        expect(warnings).toContain(
          '/src/main.ts has several bootstrap calls. Using the one in line 4.',
        );
      });
    });

    describe('a config it cannot add to', () => {
      it.each([
        [
          'an inline object',
          {
            '/src/main.ts': mainWithCall(
              `const base = {};\nbootstrapApplication(App, { providers: [], ...base });`,
            ),
          },
          'mergeApplicationConfig({ providers: [], ...base }, {',
        ],
        [
          'a variable',
          {
            '/src/main.ts': standaloneMain('./cfg'),
            '/src/cfg.ts': `const base = {};\nexport const appConfig = { providers: [], ...base };\n`,
          },
          'mergeApplicationConfig(appConfig, {',
        ],
      ])(
        'wraps %s spreading after its providers',
        async (_, files, wrapped) => {
          const once = await add(workspace('src', files));
          const twice = await add(once);
          const main = read(twice, '/src/main.ts');

          expect(main).toContain(wrapped);
          expect(main).toBe(read(once, '/src/main.ts'));
          expect(countCall(parseTS(main), 'provideFormbar')).toBe(1);
        },
      );

      it('adds to an object spreading before its providers', async () => {
        const tree = await add(
          workspace('src', {
            '/src/main.ts': standaloneMain('./cfg'),
            '/src/cfg.ts': `const base = {};\nexport const appConfig = { ...base, providers: [] };\n`,
          }),
        );

        expect(read(tree, '/src/cfg.ts')).toContain('provideFormbar(');
        expect(read(tree, '/src/main.ts')).not.toContain(
          'mergeApplicationConfig',
        );
      });

      it.each([
        ['a call without a config', `bootstrapApplication(\n  App,\n);`],
        [
          'a merge call',
          `import { mergeApplicationConfig } from '@angular/core';\nbootstrapApplication(App, mergeApplicationConfig(\n  base,\n));`,
        ],
        ['a wrapped config', `bootstrapApplication(\n  App,\n  make(),\n);`],
      ])('stays parseable with a trailing comma in %s', async (_, call) => {
        const tree = await add(
          workspace('src', { '/src/main.ts': mainWithCall(call) }),
        );
        const main = read(tree, '/src/main.ts');

        expect(syntaxErrors(main)).toEqual([]);
        expect(countCall(parseTS(main), 'provideFormbar')).toBe(1);
      });

      it('adds a named import beside a namespace import of @angular/core', async () => {
        const tree = await add(
          workspace('src', {
            '/src/main.ts': mainWithCall(
              `import * as ng from '@angular/core';\nng.enableProdMode();\nbootstrapApplication(App, make());`,
            ),
          }),
        );

        expect(read(tree, '/src/main.ts')).toContain(
          `import { mergeApplicationConfig } from '@angular/core';`,
        );
      });

      it('wraps a config variable of another project in the main file', async () => {
        const libraryFile = `export const appConfig = { providers: [] };\n`;
        const tree = await add(
          workspace(
            'src',
            {
              '/tsconfig.json': JSON.stringify({
                compilerOptions: {
                  paths: { '@lib': ['./libs/lib/src/index.ts'] },
                },
              }),
              '/src/main.ts': standaloneMain('@lib'),
              '/libs/lib/src/index.ts': libraryFile,
            },
            undefined,
            library,
          ),
        );

        expect(read(tree, '/libs/lib/src/index.ts')).toBe(libraryFile);
        expect(read(tree, '/src/main.ts')).toContain(
          'mergeApplicationConfig(appConfig, {',
        );
      });
    });

    it('survives a barrel cycle by wrapping the config', async () => {
      const tree = await add(
        workspace('src', {
          '/src/main.ts': standaloneMain('./a'),
          '/src/a.ts': `export * from './b';\n`,
          '/src/b.ts': `export * from './a';\n`,
        }),
      );

      expect(read(tree, '/src/main.ts')).toContain(
        'mergeApplicationConfig(appConfig, {',
      );
    });

    it('uses the default location when the main file has no bootstrap call', async () => {
      const tree = await add(
        workspace('src', {
          '/src/main.ts': `export {};\n`,
          '/src/app/app.config.ts': config,
        }),
      );

      expect(
        countCall(
          parseTS(read(tree, '/src/app/app.config.ts')),
          'provideFormbar',
        ),
      ).toBe(1);
    });

    it('uses the default location when the main file does not exist', async () => {
      const tree = await add(
        workspace('src', { '/src/app/app.config.ts': config }),
      );

      expect(
        countCall(
          parseTS(read(tree, '/src/app/app.config.ts')),
          'provideFormbar',
        ),
      ).toBe(1);
    });

    it('names the checked files when neither holds the root providers', async () => {
      await expect(add(workspace('src', {}))).rejects.toThrow(
        /\/src\/main\.ts.*\/src\/app\/app\.config\.ts/,
      );
    });

    it('logs the file it updates', async () => {
      const messages: string[] = [];
      const subscription = runner.logger.subscribe((entry) => {
        messages.push(entry.message);
      });

      await add(
        workspace('src', {
          '/src/main.ts': standaloneMain('./moved/config'),
          '/src/moved/config.ts': config,
        }),
      );
      subscription.unsubscribe();

      expect(messages).toContain('Updating /src/moved/config.ts');
      expect(
        messages.filter((message) => message.includes('app.config')),
      ).toEqual([]);
    });

    it('writes the located file as the registrations path', async () => {
      const tree = await add(
        workspace('src', {
          '/src/main.ts': standaloneMain('./bootstrap/config'),
          '/src/bootstrap/config.ts': config,
        }),
        { splitRegistrations: false, useSchematicConfig: false },
      );
      const [controlDefaults] = await generatorDefaults(tree, 'a');

      expect(controlDefaults?.controlRegistrationsPath).toBe(
        'bootstrap/config.ts',
      );
    });
  });

  describe('pointing the generators at the schematics configuration file', () => {
    it.each<[string, Schema]>([
      ['a custom file name', { schematicConfigFileName: 'custom.json' }],
      [
        'a location outside the source root',
        { schematicsConfigPath: '../config' },
      ],
    ])('registers a scaffold through a config at %s', async (_, options) => {
      const added = await runAdd({
        installSchematics: false,
        registrationStyle: 'config',
        ...options,
      });
      const [controlDefaults] = await generatorDefaults(added);

      const scaffolded = await new SchematicTestRunner(
        'scaffold',
        SCAFFOLD_COLLECTION_PATH,
      ).runSchematic(
        'control',
        { ...controlDefaults, key: 'slider', project: 'test-app' },
        added,
      );

      expect(
        read(scaffolded, `${registrations}/component-registrations.ts`),
      ).toContain('SliderControl');
    });

    it.each<[string, Schema, string]>([
      [
        'a custom file name',
        { schematicConfigFileName: 'custom.json' },
        'app/custom.json',
      ],
      [
        'a location outside the source root',
        { schematicsConfigPath: '../config' },
        appRoot('config/formbar-schematic.config.json'),
      ],
      [
        'another folder in the source root',
        { schematicsConfigPath: 'forms' },
        'forms/formbar-schematic.config.json',
      ],
      [
        'a folder below the app folder',
        { schematicsConfigPath: 'app/forms' },
        'app/forms/formbar-schematic.config.json',
      ],
    ])(
      'sets schematicsConfig on every generator for %s',
      async (_, options, path) => {
        const tree = await runAdd(options);

        expect(await generatorDefaults(tree)).toEqual(
          generators.map(() => ({ schematicsConfig: path })),
        );
      },
    );

    it('sets schematicsConfig for a workspace root config the project would shadow', async () => {
      appTree.create(schematicsConfigPath, '{}');

      const tree = await runAdd({ schematicsConfigPath: '/' });

      expect(await generatorDefaults(tree)).toEqual(
        generators.map(() => ({
          schematicsConfig: '/formbar-schematic.config.json',
        })),
      );
    });

    it.each<[string, Schema]>([
      ['the default location', {}],
      ['the workspace root', { schematicsConfigPath: '/' }],
    ])('leaves the generators to find the config at %s', async (_, options) => {
      const tree = await runAdd(options);

      expect(await generatorDefaults(tree)).toEqual(
        generators.map(() => undefined),
      );
    });
  });

  describe('a re-run with settings a kept schematics configuration file lacks', () => {
    async function warningsOfRun(options: Schema, project = 'test-app') {
      const warnings: string[] = [];
      const subscription = runner.logger.subscribe((entry) => {
        if (entry.level === 'warn') {
          warnings.push(entry.message);
        }
      });
      const tree = await runAdd({ project, ...options });

      subscription.unsubscribe();

      return { tree, warnings };
    }

    it.each<[string, Schema, Schema, string[]]>([
      [
        'a helper the file lacks',
        { useHelper: false },
        {},
        ['viewProviderHelperPath: app/shared/helper'],
      ],
      [
        'no helper where the file has one',
        {},
        { useHelper: false },
        ['viewProviderHelperPath: none'],
      ],
      [
        'another style',
        {},
        { registrationStyle: 'config' },
        ['registrationType: config'],
      ],
      [
        'the default style',
        { registrationStyle: 'config' },
        {},
        ['registrationType: token'],
      ],
      [
        'several settings',
        {},
        { registrationStyle: 'config', registrationsPath: 'app/other' },
        [
          'registrationType: config',
          'controlRegistrationsPath: app/other/component-registrations.ts',
        ],
      ],
    ])(
      'keeps the file and warns about %s',
      async (_, firstRun, secondRun, settings) => {
        appTree = await runAdd(firstRun);

        const kept = read(appTree, schematicsConfigPath);
        const { tree, warnings } = await warningsOfRun(secondRun);

        expect(read(tree, schematicsConfigPath)).toBe(kept);
        expect(warnings).toEqual([
          `${schematicsConfigPath} stays as it is, so these settings of this run are ignored: ${settings.join(', ')}. Change them in that file.`,
        ]);
      },
    );

    it('does not warn about the same settings', async () => {
      const options: Schema = { registrationStyle: 'config', useHelper: false };

      appTree = await runAdd(options);

      const { warnings } = await warningsOfRun(options);

      expect(warnings).toEqual([]);
    });

    it('does not warn about a default the file states', async () => {
      appTree.create(
        schematicsConfigPath,
        JSON.stringify({
          registrationType: 'token',
          viewProviderHelperPath: 'app/shared/helper',
        }),
      );

      const { warnings } = await warningsOfRun({});

      expect(warnings).toEqual([]);
    });

    describe('in the shared file at the workspace root', () => {
      const sharedFile = '/formbar-schematic.config.json';
      const otherOwnFile =
        '/projects/other/src/app/formbar-schematic.config.json';

      beforeEach(async () => {
        appTree = await runner.runExternalSchematic(
          '@schematics/angular',
          'application',
          { name: 'other', standalone: true },
          await runAdd({ schematicsConfigPath: '/' }),
        );
      });

      it('writes the settings to the own file of the project', async () => {
        const kept = read(appTree, sharedFile);
        const { tree, warnings } = await warningsOfRun(
          {
            schematicsConfigPath: '/',
            registrationStyle: 'config',
            helperPath: 'app/h2',
          },
          'other',
        );
        const ownConfig = JSON.parse(
          read(tree, otherOwnFile),
        ) as NgxFormbarAutomationConfig;

        expect(read(tree, sharedFile)).toBe(kept);
        expect(ownConfig.registrationType).toBe('config');
        expect(ownConfig.viewProviderHelperPath).toBe('app/h2');
        expect(ownConfig.schema?.type).toBe(
          'app/types/content.type.ts#AppContent',
        );
        expect(warnings).toEqual([]);
      });

      it('points the generators at the own file by the lookup alone', async () => {
        const { tree } = await warningsOfRun(
          { schematicsConfigPath: '/', registrationStyle: 'config' },
          'other',
        );
        const defaults = await generatorDefaults(tree, 'other');
        const scaffolded = await new SchematicTestRunner(
          'scaffold',
          SCAFFOLD_COLLECTION_PATH,
        ).runSchematic('control', { key: 'slider', project: 'other' }, tree);

        expect(
          defaults.map((generator) => generator?.schematicsConfig),
        ).toEqual(generators.map(() => undefined));
        expect(
          read(
            scaffolded,
            '/projects/other/src/app/registrations/component-registrations.ts',
          ),
        ).toMatch(/slider["']?:\s*loadComponent\(/);
      });

      it('shares the file while the settings are the same', async () => {
        const { tree, warnings } = await warningsOfRun(
          { schematicsConfigPath: '/' },
          'other',
        );

        expect(tree.exists(otherOwnFile)).toBe(false);
        expect(warnings).toEqual([]);
      });

      it('keeps the own file on a further run with the same settings', async () => {
        const options: Schema = {
          schematicsConfigPath: '/',
          registrationStyle: 'config',
        };

        appTree = (await warningsOfRun(options, 'other')).tree;

        const own = read(appTree, otherOwnFile);
        const { tree, warnings } = await warningsOfRun(options, 'other');

        expect(read(tree, otherOwnFile)).toBe(own);
        expect(warnings).toEqual([]);
      });
    });
  });

  describe('a stale schematicsConfig link', () => {
    it.each<[string, Schema]>([
      ['the lookup finds the config now', {}],
      ['no config file is used now', { useSchematicConfig: false }],
    ])('is removed when %s', async (_, options) => {
      const linked = await runAdd({ schematicConfigFileName: 'custom.json' });

      appTree = linked;

      const tree = await runAdd(options);
      const defaults = await generatorDefaults(tree);

      expect(defaults.map((generator) => generator?.schematicsConfig)).toEqual(
        generators.map(() => undefined),
      );
    });

    it('keeps the other settings of a generator', async () => {
      const linked = await runAdd({ schematicConfigFileName: 'custom.json' });

      appTree = linked;

      const tree = await runAdd({
        useSchematicConfig: false,
        registrationStyle: 'config',
      });
      const [controlDefaults] = await generatorDefaults(tree);

      expect(controlDefaults?.registrationType).toBe('config');
      expect(controlDefaults).not.toHaveProperty('schematicsConfig');
    });
  });

  describe('useSchematicConfig is false with a config file in reach', () => {
    async function warningsOfRun(options: Schema) {
      const warnings: string[] = [];
      const subscription = runner.logger.subscribe((entry) => {
        if (entry.level === 'warn') {
          warnings.push(entry.message);
        }
      });

      await runAdd(options);
      subscription.unsubscribe();

      return warnings;
    }

    it('warns naming the workspace root config that overrides the settings', async () => {
      appTree.create('/formbar-schematic.config.json', '{}');

      expect(await warningsOfRun({ useSchematicConfig: false })).toContain(
        '/formbar-schematic.config.json overrides the settings written to angular.json, as the generators prefer a schematics configuration file.',
      );
    });

    it('does not warn without a config file', async () => {
      expect(await warningsOfRun({ useSchematicConfig: false })).toEqual([]);
    });
  });

  it('seeds an empty content union and the schema config', async () => {
    const result = await runner.runSchematic(
      'ng-add',
      { project: 'test-app' },
      appTree,
    );

    expect(
      result.exists('/projects/test-app/src/app/types/content.type.ts'),
    ).toBe(true);
    expect(
      result.readText('/projects/test-app/src/app/types/content.type.ts'),
    ).toContain('export type AppContent = never;');

    const config = JSON.parse(
      result.readText(
        '/projects/test-app/src/app/formbar-schematic.config.json',
      ),
    ) as NgxFormbarAutomationConfig;

    expect(config.schema).toEqual({
      type: 'app/types/content.type.ts#AppContent',
      emitters: [{ use: 'json-schema-2020-12', output: 'form.schema.json' }],
    });
  });

  it('keeps an existing content union file untouched', async () => {
    const existing = 'export type AppContent = { type: "custom" };\n';
    appTree.create(contentTypePath, existing);

    const result = await runAdd();

    expect(read(result, contentTypePath)).toBe(existing);
  });

  it('reports creating a seeded file that does not exist yet', async () => {
    const messages: string[] = [];
    runner.logger.subscribe((entry) => messages.push(entry.message));

    await runAdd();

    expect(messages).toContain('Creating content union file');
    expect(messages).not.toContain(`Keeping existing ${contentTypePath}`);
  });

  it('reports keeping a seeded file that already exists', async () => {
    appTree.create(contentTypePath, 'export type AppContent = never;\n');
    const messages: string[] = [];
    runner.logger.subscribe((entry) => messages.push(entry.message));

    await runAdd();

    expect(messages).toContain(`Keeping existing ${contentTypePath}`);
    expect(messages).not.toContain('Creating content union file');
  });
});
