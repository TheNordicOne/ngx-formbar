import { beforeEach, describe, expect, it } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { JsonObject } from '@angular-devkit/core';
import { Tree } from '@angular-devkit/schematics';
import { join } from 'path';
import { app, exists, read } from '@ngx-formbar/schematics/testing';
import { Schema } from '../ng-add/schema';
import { setupWorkspace } from './workspace-setup';

const COLLECTION_PATH = join(
  __dirname,
  '../../../../dist/libs/reactive-forms/schematics/collection.json',
);

const browser = '@angular/platform-browser';
const core = '@ngx-formbar/core';
const reactiveForms = '@ngx-formbar/reactive-forms';
const defaultConfig = '/src/app/app.config.ts';

describe('what ng add edits', () => {
  let runner: SchematicTestRunner;

  beforeEach(() => {
    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);
  });

  function logged(run: () => Promise<UnitTestTree>) {
    const messages: { level: string; message: string }[] = [];
    const subscription = runner.logger.subscribe(({ level, message }) => {
      messages.push({ level, message });
    });

    return run().then((tree) => {
      subscription.unsubscribe();

      return {
        tree,
        infos: messages
          .filter(({ level }) => level === 'info')
          .map(({ message }) => message),
        warnings: messages
          .filter(({ level }) => level === 'warn')
          .map(({ message }) => message),
      };
    });
  }

  describe('in the root providers of an application', () => {
    const appConfigPath = app('app.config.ts');
    let appTree: UnitTestTree;

    beforeEach(async () => {
      appTree = await setupWorkspace(runner);
    });

    function runAdd(options: Schema = {}, tree = appTree) {
      return runner.runSchematic(
        'ng-add',
        { project: 'test-app', ...options },
        tree,
      );
    }

    describe('tokens in the root providers, without separate files', () => {
      const options: Schema = {
        registrationStyle: 'token',
        provideInline: true,
        splitRegistrations: false,
      };

      it('provides only components once, and validators many times', async () => {
        const text = read(await runAdd(options), appConfigPath);

        expect(text).toMatch(
          /provide: NGX_FW_COMPONENT_REGISTRATIONS,\s*useValue: new Map\(\[\]\)\s*\}/,
        );
        expect(text).toMatch(
          /provide: NGX_FW_VALIDATOR_REGISTRATIONS,\s*useValue: new Map\(\[\]\),\s*multi: true\s*\}/,
        );
        expect(text).toMatch(
          /provide: NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,\s*useValue: new Map\(\[\]\),\s*multi: true\s*\}/,
        );
      });

      it('imports each symbol from its own package only', async () => {
        const text = read(await runAdd(options), appConfigPath);

        expect(text).toContain(
          `import { NGX_FW_COMPONENT_REGISTRATIONS } from '${core}';`,
        );
        expect(text).toContain(
          `import { provideFormbar, NGX_FW_VALIDATOR_REGISTRATIONS, NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS } from '${reactiveForms}';`,
        );
      });

      it('leaves out the validators not asked for', async () => {
        const text = read(
          await runAdd({
            ...options,
            includeSyncValidators: false,
            includeAsyncValidators: false,
          }),
          appConfigPath,
        );

        expect(text).not.toContain('VALIDATOR');
      });

      it.each([
        [
          'another token',
          '{ provide: OTHER, useValue: NGX_FW_COMPONENT_REGISTRATIONS }',
        ],
        ['a spread', '...spreadProviders'],
        ['a provider with a method', '{ provide() { return 1; } }'],
        ['another key', '{ token: NGX_FW_COMPONENT_REGISTRATIONS }'],
        [
          'a computed provide',
          '{ provide: tokens.NGX_FW_COMPONENT_REGISTRATIONS }',
        ],
      ])('adds its provider next to %s', async (_, element) => {
        appTree.overwrite(
          appConfigPath,
          `export const appConfig = { providers: [${element}] };\n`,
        );

        expect(read(await runAdd(options), appConfigPath)).toMatch(
          /provide: NGX_FW_COMPONENT_REGISTRATIONS,\s*useValue/,
        );
      });

      it('finds a provider it added before', async () => {
        appTree.overwrite(
          appConfigPath,
          `export const appConfig = { providers: [{ useValue: 1, provide: NGX_FW_COMPONENT_REGISTRATIONS }] };\n`,
        );

        expect(read(await runAdd(options), appConfigPath)).not.toMatch(
          /provide: NGX_FW_COMPONENT_REGISTRATIONS,\s*useValue/,
        );
      });
    });

    describe('a config in the root providers, without separate files', () => {
      const options: Schema = {
        registrationStyle: 'config',
        provideInline: true,
        splitRegistrations: false,
      };

      it('lists what it was asked for, on lines of their own', async () => {
        expect(read(await runAdd(options), appConfigPath)).toMatch(
          /provideFormbar\(\{\s*\n\s*componentRegistrations: \{\},\s*\n\s*validatorRegistrations: \{\},\s*\n\s*asyncValidatorRegistrations: \{\}\s*\n\s*\}\)/,
        );
      });

      it('leaves out the validators not asked for', async () => {
        const text = read(
          await runAdd({
            ...options,
            includeSyncValidators: false,
            includeAsyncValidators: false,
          }),
          appConfigPath,
        );

        expect(text).toContain('componentRegistrations');
        expect(text).not.toContain('alidatorRegistrations');
      });

      it('adds no token providers', async () => {
        expect(read(await runAdd(options), appConfigPath)).not.toContain(
          'NGX_FW_',
        );
      });
    });

    it('imports nothing it does not use from separate files', async () => {
      const text = read(
        await runAdd({
          registrationStyle: 'config',
          provideInline: true,
          includeSyncValidators: false,
          includeAsyncValidators: false,
        }),
        appConfigPath,
      );

      expect(text).toContain('import { componentRegistrations } from');
      expect(text).not.toContain('alidatorRegistrations');
    });

    it('imports each validator from separate files when asked to', async () => {
      const text = read(
        await runAdd({ registrationStyle: 'config', provideInline: true }),
        appConfigPath,
      );

      expect(text).toContain(
        "import { componentRegistrations, validatorRegistrations, asyncValidatorRegistrations } from './registrations';",
      );
    });

    it('imports from the separate files in a config file of its own', async () => {
      const tree = await runAdd({ registrationStyle: 'config' });

      expect(read(tree, app('formbar.config.ts'))).toContain(
        "import { componentRegistrations, validatorRegistrations, asyncValidatorRegistrations } from './registrations';",
      );
    });

    it('imports only components without validators in that file', async () => {
      const tree = await runAdd({
        registrationStyle: 'config',
        includeSyncValidators: false,
        includeAsyncValidators: false,
      });

      expect(read(tree, app('formbar.config.ts'))).toContain(
        "import { componentRegistrations } from './registrations';",
      );
    });

    it('writes an import per file on a line of its own', async () => {
      appTree.create(app('shared/index.ts'), 'export const other = 1;\n');

      const tree = await runAdd({
        registrationStyle: 'config',
        registrationsPath: 'app/shared',
      });
      const imports = read(tree, app('formbar.config.ts'))
        .split('\n')
        .filter((line) => line.includes('alidatorRegistrations } from'));

      expect(imports).toHaveLength(2);
    });

    it.each<[string, Schema]>([
      ['token', {}],
      ['token, without separate files', { splitRegistrations: false }],
      ['token, in place', { provideInline: true }],
      [
        'token, in place, without separate files',
        { provideInline: true, splitRegistrations: false },
      ],
      ['config', { registrationStyle: 'config' }],
      [
        'config, in place',
        { registrationStyle: 'config', provideInline: true },
      ],
      [
        'config, in place, without separate files',
        {
          registrationStyle: 'config',
          provideInline: true,
          splitRegistrations: false,
        },
      ],
    ])('changes nothing on a second run with %s', async (_, options) => {
      const once = await runAdd(options);
      const text = read(once, appConfigPath);
      const twice = await runAdd(options, once);

      expect(read(twice, appConfigPath)).toBe(text);
    });

    it('reports what it does', async () => {
      const { infos } = await logged(() => runAdd({}));

      expect(infos).toEqual(
        expect.arrayContaining([
          '📦 Setting up ngx-formbar in project "test-app"...',
          'Creating token registration files',
          'Creating provider file',
          'Creating helper files',
          'Creating schematics configuration file',
          `${appConfigPath} updated`,
          '✅ ngx-formbar has been set up successfully!',
          `📦 Installing ${core}...`,
        ]),
      );
    });

    it('reports the files of the config style', async () => {
      const { infos } = await logged(() =>
        runAdd({ registrationStyle: 'config' }),
      );

      expect(infos).toContain('Creating registration configuration files');
    });

    it('reports the settings it writes to angular.json', async () => {
      const { infos } = await logged(() =>
        runAdd({ useSchematicConfig: false }),
      );

      expect(infos).toContain('Updating schematics configuration');
    });

    it('does not install core when it is a peer dependency', async () => {
      appTree.overwrite(
        '/package.json',
        JSON.stringify({ peerDependencies: { [core]: '*' } }),
      );

      const { infos } = await logged(() => runAdd({}));

      expect(infos).not.toContain(`📦 Installing ${core}...`);
    });

    it('replaces the old name of the registrations option', async () => {
      const workspace = appTree.readJson('/angular.json') as {
        projects: Record<string, { schematics: JsonObject }>;
      };

      workspace.projects['test-app'].schematics[
        '@ngx-formbar/schematics:control'
      ] = { controlRegistrations: 'old.ts' };
      appTree.overwrite('/angular.json', JSON.stringify(workspace));

      const tree = await runAdd({ useSchematicConfig: false });

      expect(read(tree, '/angular.json')).not.toContain('old.ts');
    });

    it('lists every setting a config file wins with', async () => {
      appTree.create(
        '/formbar-schematic.config.json',
        JSON.stringify({
          registrationType: 'config',
          controlRegistrationsPath: 'x.ts',
        }),
      );

      const { warnings } = await logged(() =>
        runAdd({ useSchematicConfig: false }),
      );

      expect(warnings).toContain(
        'The schematics configuration of this project sets registrationType, controlRegistrationsPath, which win over the settings written to angular.json.',
      );
    });

    it('says when a new file goes over the shared one', async () => {
      appTree.create('/formbar-schematic.config.json', '{}');

      const { infos } = await logged(() => runAdd({}));

      expect(infos).toContain(
        `${app('formbar-schematic.config.json')} goes over /formbar-schematic.config.json and holds what differs from it.`,
      );
    });

    it('says nothing about the shared file for a kept file', async () => {
      const kept = app('formbar-schematic.config.json');

      appTree.create('/formbar-schematic.config.json', '{}');
      appTree.create(kept, '{}');

      const { infos } = await logged(() => runAdd({}));

      expect(infos.join('\n')).not.toContain('goes over');
    });
  });

  describe('in a workspace of its own', () => {
    function workspace(
      files: Record<string, string>,
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
              sourceRoot: 'src',
              architect: {
                build: {
                  builder: '@angular/build:application',
                  options: {},
                },
              },
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

    function add(tree: UnitTestTree, options: Schema = {}) {
      return runner.runSchematic(
        'ng-add',
        { project: 'a', installSchematics: false, ...options },
        tree,
      );
    }

    const config = 'export const appConfig = { providers: [] };\n';

    describe('a call in the main file that is no bootstrap call', () => {
      it.each([
        [
          'a local function of that name',
          `import { bootstrapApplication } from './local';\nbootstrapApplication(App, { providers: [] });\n`,
        ],
        [
          'another export under that name',
          `import { createApplication as bootstrapApplication } from '${browser}';\nbootstrapApplication(App, { providers: [] });\n`,
        ],
        [
          'another export of the namespace',
          `import * as ng from '${browser}';\nng.createApplication(App, { providers: [] });\n`,
        ],
        [
          'that name on something else',
          `import * as ng from '${browser}';\nother.bootstrapApplication(App, { providers: [] });\n`,
        ],
      ])('skips %s', async (_, main) => {
        const tree = await add(
          workspace({ '/src/main.ts': main, [defaultConfig]: config }),
        );

        expect(read(tree, '/src/main.ts')).toBe(main);
        expect(read(tree, defaultConfig)).toContain('provideFormbar(');
      });

      it('does not follow a function that is no dynamic import', async () => {
        const other = `import { bootstrapApplication } from '${browser}';\nbootstrapApplication(App, { providers: [] });\n`;
        const tree = await add(
          workspace({
            '/src/main.ts': `load('./other');\n`,
            '/src/other.ts': other,
            [defaultConfig]: config,
          }),
        );

        expect(read(tree, '/src/other.ts')).toBe(other);
      });
    });

    it.each([
      ['only a side effect', `import '${browser}';`],
      ['a default import', `import browser from '${browser}';`],
      ['a named import', `import { createApplication } from '${browser}';`],
    ])('reads a namespace call next to %s', async (_, line) => {
      const tree = await add(
        workspace({
          '/src/main.ts': `${line}\nimport * as ng from '${browser}';\nng.bootstrapApplication(App, { providers: [] });\n`,
        }),
      );

      expect(read(tree, '/src/main.ts')).toContain('provideFormbar(');
    });

    it('stops at imports that go in a circle', async () => {
      const tree = await add(
        workspace({
          '/src/main.ts': `import './other';\n`,
          '/src/other.ts': `import './main';\n`,
          [defaultConfig]: config,
        }),
      );

      expect(read(tree, defaultConfig)).toContain('provideFormbar(');
    });

    it('wraps a config variable it cannot resolve', async () => {
      const tree = await add(
        workspace({
          '/src/main.ts': `import { bootstrapApplication } from '${browser}';\nbootstrapApplication(App, missing);\n`,
        }),
      );

      expect(read(tree, '/src/main.ts')).toContain(
        'mergeApplicationConfig(missing, {',
      );
    });

    const moduleCall = (argument: string) =>
      `import { platformBrowser } from '${browser}';\nplatformBrowser().bootstrapModule(${argument});\n`;

    it.each([
      ['no argument', '', ''],
      ['a call', 'make()', 'make()'],
      ['an unknown name', 'Missing', 'Missing'],
    ])('fails on bootstrapping a module with %s', async (_, argument, name) => {
      await expect(
        add(workspace({ '/src/main.ts': moduleCall(argument) })),
      ).rejects.toThrow(
        `Could not edit the root NgModule "${name}" bootstrapped in /src/main.ts. It has to be a class declared in this project.`,
      );
    });

    const moduleFile = (decorators: string) => ({
      '/src/main.ts': `import { platformBrowser } from '${browser}';\nimport { AppModule } from './app.module';\nplatformBrowser().bootstrapModule(AppModule);\n`,
      '/src/app.module.ts': `import { NgModule } from '@angular/core';\n${decorators}\nexport class AppModule {}\n`,
    });

    it.each([
      ['a variable', '@NgModule(METADATA)'],
      ['nothing', '@NgModule()'],
      ['no NgModule at all', '@Other({ providers: [] })'],
    ])('fails on metadata that is %s', async (_, decorators) => {
      await expect(add(workspace(moduleFile(decorators)))).rejects.toThrow(
        'Could not find the @NgModule metadata of "AppModule" in /src/app.module.ts. It has to be an object in the decorator.',
      );
    });

    it('fails on metadata that spreads next to other properties', async () => {
      await expect(
        add(workspace(moduleFile('@NgModule({ ...base, imports: [] })'))),
      ).rejects.toThrow(
        'Could not add the root providers to the @NgModule in /src/app.module.ts, as its metadata spreads another object.',
      );
    });

    it('finds the NgModule among other decorators', async () => {
      const tree = await add(
        workspace(
          moduleFile('@Bare\n@Other({ a: 1 })\n@NgModule({ providers: [] })'),
        ),
      );
      const text = read(tree, '/src/app.module.ts');

      expect(text).toContain('@Other({ a: 1 })');
      expect(text).toMatch(/@NgModule\(\{ providers: \[\s*provideFormbar/);
    });

    it('finds the NgModule next to an unnamed class', async () => {
      const files = moduleFile('@NgModule({ providers: [] })');
      const tree = await add(
        workspace({
          ...files,
          '/src/app.module.ts': `export default class {}\n${files['/src/app.module.ts']}`,
        }),
      );

      expect(read(tree, '/src/app.module.ts')).toContain('provideFormbar(');
    });

    it('adds the array to empty metadata without a comma', async () => {
      const tree = await add(workspace(moduleFile('@NgModule({})')));

      expect(read(tree, '/src/app.module.ts')).not.toMatch(/\],\s*\}/);
    });

    const applicationCall = (config: string) =>
      `import { bootstrapApplication, mergeApplicationConfig } from '${browser}';\nimport { mergeApplicationConfig as merge } from '@angular/core';\nbootstrapApplication(App${config});\n`;

    it('adds to a providers array in the call', async () => {
      const tree = await add(
        workspace({ '/src/main.ts': applicationCall(', { providers: [] }') }),
      );

      expect(read(tree, '/src/main.ts')).not.toContain('merge(');
    });

    it('wraps a config that spreads next to other properties', async () => {
      const tree = await add(
        workspace({ '/src/main.ts': applicationCall(', { ...base, a: 1 }') }),
      );

      expect(read(tree, '/src/main.ts')).toContain(
        'merge({ ...base, a: 1 }, {',
      );
    });

    it('adds an object to a merge call without arguments', async () => {
      const tree = await add(
        workspace({ '/src/main.ts': applicationCall(', merge()') }),
      );

      expect(read(tree, '/src/main.ts')).toMatch(/merge\(\{\s*providers: \[/);
    });

    it('adds the array to an empty config without a comma', async () => {
      const tree = await add(
        workspace({ '/src/main.ts': applicationCall(', {}') }),
      );

      expect(read(tree, '/src/main.ts')).toMatch(/\]\s*\}\);/);
    });

    describe('the default config file', () => {
      const main = `load();\n`;

      it('skips an object it cannot add to', async () => {
        const tree = await add(
          workspace({
            '/src/main.ts': main,
            [defaultConfig]: `export const options = { a: 1 };\n${config}`,
          }),
        );

        expect(read(tree, defaultConfig)).toContain(
          'export const options = { a: 1 };',
        );
        expect(read(tree, defaultConfig)).toContain('provideFormbar(');
      });

      it.each([
        ['a call', 'export const appConfig = { providers: make() };\n'],
        ['a shorthand', 'export const appConfig = { providers };\n'],
        ['nothing', 'export const appConfig = {};\n'],
      ])('fails on providers that are %s', async (_, content) => {
        await expect(
          add(workspace({ '/src/main.ts': main, [defaultConfig]: content })),
        ).rejects.toThrow(`'providers' array not found in ${defaultConfig}`);
      });
    });

    describe('a run that creates the shared file', () => {
      const ownConfig = '/src/app/formbar-schematic.config.json';
      const other: JsonObject = {
        b: { projectType: 'application', root: 'b', sourceRoot: 'b/src' },
      };
      const otherConfig = '/b/src/app/formbar-schematic.config.json';
      const files = { '/src/main.ts': 'load();\n', [defaultConfig]: config };
      const shared = {
        schematicsConfigPath: '/',
        registrationStyle: 'config',
      } as const;

      it.each<[string, Schema]>([
        [
          'without a schematics configuration file',
          { useSchematicConfig: false },
        ],
        ['into a file of its own', { schematicsConfigPath: 'app' }],
      ])('warns about nothing %s', async (_, options) => {
        const { warnings } = await logged(() =>
          add(workspace({ ...files, [otherConfig]: '{}' }, other), {
            registrationStyle: 'config',
            ...options,
          }),
        );

        expect(warnings.join('\n')).not.toContain('other projects');
      });

      it('warns about nothing when the shared file exists', async () => {
        const { warnings } = await logged(() =>
          add(
            workspace(
              {
                ...files,
                [otherConfig]: '{}',
                '/formbar-schematic.config.json': '{}',
              },
              other,
            ),
            shared,
          ),
        );

        expect(warnings.join('\n')).not.toContain('other projects');
      });

      it('warns about nothing for its own file', async () => {
        const { warnings } = await logged(() =>
          add(workspace({ ...files, [ownConfig]: '{}' }), shared),
        );

        expect(warnings.join('\n')).not.toContain('other projects');
      });

      it('warns about nothing for a project without a file', async () => {
        const { warnings } = await logged(() =>
          add(workspace(files, other), shared),
        );

        expect(warnings.join('\n')).not.toContain('other projects');
      });

      it('warns about nothing for a project stating the setting', async () => {
        const { warnings } = await logged(() =>
          add(
            workspace(
              {
                ...files,
                [otherConfig]: JSON.stringify({ registrationType: 'token' }),
              },
              other,
            ),
            { ...shared, useHelper: false },
          ),
        );

        expect(warnings.join('\n')).not.toContain('other projects');
      });

      it('skips a link outside the workspace', async () => {
        const linked: JsonObject = {
          b: {
            ...(other.b as JsonObject),
            schematics: {
              '@ngx-formbar/schematics:register': {
                schematicsConfig: '../../../outside.json',
              },
            },
          },
        };

        await expect(
          add(workspace(files, linked), shared),
        ).resolves.toBeDefined();
      });

      it('names every setting and project, on lines of their own', async () => {
        const { warnings } = await logged(() =>
          add(
            workspace(
              {
                ...files,
                [otherConfig]: '{}',
                '/c/src/app/formbar-schematic.config.json': '{}',
              },
              {
                ...other,
                c: {
                  projectType: 'application',
                  root: 'c',
                  sourceRoot: 'c/src',
                },
              },
            ),
            { ...shared, useHelper: true },
          ),
        );

        expect(warnings).toContain(
          `/formbar-schematic.config.json changes other projects. To keep what they use now, write this into their files:\n  ${otherConfig}: "registrationType": "token", "viewProviderHelperPath": null\n  /c/src/app/formbar-schematic.config.json: "registrationType": "token", "viewProviderHelperPath": null`,
        );
      });

      it('reports the projects it updated', async () => {
        const { infos } = await logged(() =>
          add(workspace({ ...files, [otherConfig]: '{}' }, other), {
            ...shared,
            useHelper: false,
            updateOtherProjects: true,
          }),
        );

        expect(infos).toContain(
          `Updated other projects:\n  ${otherConfig}: "registrationType": "token"`,
        );
      });
    });

    it('keeps inline token registrations of a root NgModule in place', async () => {
      const tree = await add(
        workspace({
          '/src/main.ts': `import { platformBrowser } from '${browser}';\nimport { AppModule } from './app.module';\nplatformBrowser().bootstrapModule(AppModule);\n`,
          '/src/app.module.ts': `import { NgModule } from '@angular/core';\n@NgModule({ providers: [] })\nexport class AppModule {}\n`,
        }),
        {
          registrationStyle: 'token',
          provideInline: true,
          splitRegistrations: false,
        },
      );

      expect(exists(tree, '/src/app/registrations/index.ts')).toBe(false);
    });
  });
});
