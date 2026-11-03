import { beforeEach, describe, expect } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';

import {
  addComponentFiles,
  addProject,
  addRootProject,
  COLLECTION_PATH,
  createControlComponent,
  createUnrelatedComponent,
  helperProviders,
  inlineProviders,
  provideMap,
  provideToken,
  setupWorkspace,
  TestComponentDetails,
} from './workspace-setup';
import {
  app,
  countComponentRegistrationsMapProviderIdentifier,
  countNamedImport,
  forEachAtLeastOnce,
  hasDynamicImportOf,
  read,
  src,
  writeJson,
  componentRegistrationsMapProviderHasIdentifier,
  directComponentRegistrationsHasIdentifier,
  parseTS,
  hasNamedImport,
} from './helper';
import { DiscoverOptions } from '../register/schema';
import { createTreeProgram } from '../schema/program';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { SourceFile } from 'typescript';
import { NgxFormbarAutomationConfig } from '@ngx-formbar/setup';

const PROPERTY_DOES_NOT_EXIST = 2339;

describe('register schematic', () => {
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;

  const baseOptions: DiscoverOptions = {
    project: 'test-app',
  };

  const appConfigPathRaw = 'app.config.ts';
  const formbarConfigPath = 'app/formbar.config.ts';
  const schematicsConfigPath = 'app/formbar-schematic.config.json';
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

  it('rejects a registration type other than token and config', async () => {
    await expect(
      runner.runSchematic(
        'register',
        { ...baseOptions, registrationType: 'tokens' },
        appTree,
      ),
    ).rejects.toThrow(/registrationType/);
  });

  it('treats a --controlRegistrations above the workspace root as a missing file', async () => {
    const warnings: string[] = [];
    runner.logger.subscribe((entry) => {
      if (entry.level === 'warn') {
        warnings.push(entry.message);
      }
    });

    await runSchematic({
      controlRegistrations: '../../../../registrations.ts',
    });

    expect(warnings).toContain(
      'Registration file ../../../../registrations.ts could not be found. Skipping registration.',
    );
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

    expect(controlImportCount).toBe(0);
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

  it('uses schematics configuration file when passed as parameter', async () => {
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

    const schematicsConfig = 'configurations/formbar-schematic.config.json';
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

  it('finds schematics configuration file if no parameter was passed', async () => {
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

  it.each(['controlRegistrations', 'controlRegistrationsPath'])(
    'honors the %s option when no config file is present',
    async (option) => {
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
      const customRegistrations = 'app/forms/component-registrations.ts';

      addComponentFiles(appTree, files);
      provideMap(
        appTree,
        appConfigPathRaw,
        customRegistrations,
        formbarConfigPath,
      );

      const tree = await runSchematic({
        registrationType: 'config',
        [option]: customRegistrations,
      });

      assertRegisteredComponents(
        tree,
        files,
        src(customRegistrations),
        directComponentRegistrationsHasIdentifier,
      );
    },
  );

  it.each([
    'projects/test-app/src/app/forms/component-registrations.ts',
    '/projects/test-app/src/app/forms/component-registrations.ts',
  ])(
    'registers into a controlRegistrations path of %s as given',
    async (controlRegistrations) => {
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
      const customRegistrations = 'app/forms/component-registrations.ts';

      addComponentFiles(appTree, files);
      provideMap(
        appTree,
        appConfigPathRaw,
        customRegistrations,
        formbarConfigPath,
      );

      const tree = await runSchematic({
        registrationType: 'config',
        controlRegistrations,
      });

      assertRegisteredComponents(
        tree,
        files,
        src(customRegistrations),
        directComponentRegistrationsHasIdentifier,
      );
    },
  );

  describe('what counts as a control', () => {
    async function registeredAfterCreating(path: string, content: string) {
      appTree.create(path, content);
      provideToken(appTree, appConfigPathRaw, registrationsPath);

      return read(await runSchematic(), src(registrationsPath));
    }

    it('skips a page hosting the form', async () => {
      const registrations = await registeredAfterCreating(
        app('checkout/checkout-page.ts'),
        `import { Component } from '@angular/core';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';

@Component({
  selector: 'app-checkout-page',
  imports: [NgxFbFormComponent],
  template: '<ngxfb-form />',
})
export class CheckoutPage {}
`,
      );

      expect(registrations).not.toContain('CheckoutPage');
    });

    it('skips a page that only imports a type', async () => {
      const registrations = await registeredAfterCreating(
        app('checkout/summary-page.ts'),
        `import { Component } from '@angular/core';
import { NgxFbForm } from '@ngx-formbar/core';

@Component({ selector: 'app-summary-page', template: '' })
export class SummaryPage {
  readonly form: NgxFbForm = { content: {} };
}
`,
      );

      expect(registrations).not.toContain('SummaryPage');
    });

    it('skips a component implementing something else', async () => {
      const registrations = await registeredAfterCreating(
        app('checkout/other-page.ts'),
        `import { Component, OnInit } from '@angular/core';
import { NgxFbForm } from '@ngx-formbar/core';

@Component({ selector: 'app-other-page', template: '' })
export class OtherPage implements OnInit {
  readonly form?: NgxFbForm;
  ngOnInit() {}
}
`,
      );

      expect(registrations).not.toContain('OtherPage');
    });

    describe('what a registration cannot import', () => {
      const nameInput = 'readonly name = input.required<string>();';
      const header = `import { Component, input } from '@angular/core';
import { ReactiveFormbarControl } from '@ngx-formbar/reactive-forms';

interface TagsConfig { type: 'tags'; }

@Component({ selector: 'app-tags-input', template: '' })`;

      function collectWarnings() {
        const warnings: string[] = [];
        runner.logger.subscribe((entry) => {
          if (entry.level === 'warn') {
            warnings.push(entry.message);
          }
        });

        return warnings;
      }

      it('skips an abstract class silently', async () => {
        const warnings = collectWarnings();

        const registrations = await registeredAfterCreating(
          app('tags/tags-input.ts'),
          `${header}
export abstract class TagsInput implements ReactiveFormbarControl<TagsConfig> { ${nameInput} }
`,
        );

        expect(registrations).not.toContain('TagsInput');
        expect(warnings).toEqual([]);
      });

      it('registers a class extending an abstract one, and not the abstract one', async () => {
        const registrations = await registeredAfterCreating(
          app('tags/tags-input.ts'),
          `${header}
export abstract class BaseInput implements ReactiveFormbarControl<TagsConfig> { ${nameInput} }

@Component({ selector: 'app-tags', template: '' })
export class TagsInput extends BaseInput {}
`,
        );

        expect(registrations).toContain('TagsInput');
        expect(registrations).not.toContain('BaseInput');
      });

      it.each<[string, string]>([
        [
          'a class without an export',
          `class TagsInput implements ReactiveFormbarControl<TagsConfig> { ${nameInput} }`,
        ],
        [
          'a default export',
          `export default class TagsInput implements ReactiveFormbarControl<TagsConfig> { ${nameInput} }`,
        ],
        [
          'an export under another name',
          `class TagsInput implements ReactiveFormbarControl<TagsConfig> { ${nameInput} }\nexport { TagsInput as Tags };`,
        ],
      ])('skips %s with a warning', async (_, declaration) => {
        const warnings = collectWarnings();

        const registrations = await registeredAfterCreating(
          app('tags/tags-input.ts'),
          `${header}\n${declaration}\n`,
        );

        expect(registrations).not.toContain('TagsInput');
        expect(warnings).toEqual([
          'TagsInput is not a named export, so it is not registered.',
        ]);
      });

      it('registers a class exported after its declaration', async () => {
        const registrations = await registeredAfterCreating(
          app('tags/tags-input.ts'),
          `${header}
class TagsInput implements ReactiveFormbarControl<TagsConfig> { ${nameInput} }
export { TagsInput };
`,
        );

        expect(registrations).toContain('TagsInput');
      });

      it('does not warn about a class without a contract', async () => {
        const warnings = collectWarnings();

        await registeredAfterCreating(
          app('tags/tags-page.ts'),
          `import { Component } from '@angular/core';

@Component({ selector: 'app-tags-page', template: '' })
export default class TagsPage {}
`,
        );

        expect(warnings).toEqual([]);
      });

      it('leaves registrations that compile', async () => {
        for (const [name, declaration] of Object.entries({
          Abstract: 'export abstract class',
          Hidden: 'class',
          Default: 'export default class',
          Named: 'export class',
        })) {
          appTree.create(
            app(`tags/${name.toLowerCase()}.ts`),
            `import { Component, input } from '@angular/core';
import { ReactiveFormbarControl } from '@ngx-formbar/reactive-forms';

@Component({ selector: 'app-${name}', template: '' })
${declaration} ${name}Input implements ReactiveFormbarControl<{ type: '${name}' }> { ${nameInput} }
`,
          );
        }
        provideToken(appTree, appConfigPathRaw, registrationsPath);

        const tree = await runSchematic();
        const file = src(registrationsPath);
        const { program } = createTreeProgram(tree, '/tsconfig.json', [file]);
        const missingMembers = program
          .getSemanticDiagnostics(program.getSourceFile(file))
          .filter(({ code }) => code === PROPERTY_DOES_NOT_EXIST)
          .map(({ messageText }) => messageText);

        expect(missingMembers).toEqual([]);
        expect(read(tree, file)).toContain('NamedInput');
      });
    });

    it.each<[string, string, string]>([
      ['ReactiveFormbarControl', 'NgxFbControl', 'name'],
      ['ReactiveFormbarGroup', 'NgxFbFormGroup', 'name'],
      ['ReactiveFormbarArray', 'NgxFbArray', 'name'],
      ['FormbarBlock', 'NgxFbBlock', ''],
    ])(
      'finds %s imported through a local barrel',
      async (contract, config, input) => {
        appTree.create(
          app('shared/index.ts'),
          `export { ${contract} } from '@ngx-formbar/reactive-forms';\n`,
        );

        const registrations = await registeredAfterCreating(
          app('tags/tags-input.ts'),
          `import { Component, input } from '@angular/core';
import { ${config} } from '@ngx-formbar/core';
import { ${contract} } from '../shared';

interface TagsConfig extends ${config} { type: 'tags'; }

@Component({ selector: 'app-tags-input', template: '' })
export class TagsInput implements ${contract}<TagsConfig> {
  ${input && `readonly ${input} = input.required<string>();`}
}
`,
        );

        expect(registrations).toContain('TagsInput');
      },
    );
  });

  describe('the project it looks in', () => {
    function controlAt(path: string, className: string) {
      appTree.create(
        path,
        createControlComponent('x', inlineProviders, className),
      );
    }

    async function registeredIn(file: string, options: DiscoverOptions = {}) {
      appTree.create(file, 'export const componentRegistrations = {};\n');

      return read(
        await runSchematic({
          registrationType: 'config',
          controlRegistrations: `/${file}`,
          ...options,
        }),
        `/${file}`,
      );
    }

    it.each<[string, string]>([
      ['a spec file', app('tags/tags-input.spec.ts')],
      ['a nested node_modules folder', app('node_modules/tags/tags-input.ts')],
    ])('skips %s', async (_, path) => {
      appTree.create(
        path,
        createControlComponent('tags', inlineProviders, 'TagsInput'),
      );
      provideToken(appTree, appConfigPathRaw, registrationsPath);

      const tree = await runSchematic();

      expect(read(tree, src(registrationsPath))).not.toContain('TagsInput');
    });

    it('skips the other projects of the workspace', async () => {
      appTree = await runner.runExternalSchematic(
        '@schematics/angular',
        'application',
        { name: 'other', standalone: true },
        appTree,
      );
      controlAt(app('mine.ts'), 'MineComponent');
      controlAt('/projects/other/src/app/foreign.ts', 'ForeignComponent');

      const registrations = await registeredIn(src(registrationsPath).slice(1));

      expect(registrations).toContain('MineComponent');
      expect(registrations).not.toContain('ForeignComponent');
    });

    it('skips what lies outside the source root', async () => {
      controlAt(app('mine.ts'), 'MineComponent');
      controlAt('/projects/test-app/tools/tool.ts', 'ToolComponent');

      const registrations = await registeredIn(src(registrationsPath).slice(1));

      expect(registrations).toContain('MineComponent');
      expect(registrations).not.toContain('ToolComponent');
    });

    it('skips a project nested in the source root', async () => {
      addProject(appTree, 'nested', 'projects/test-app/src/nested');
      controlAt(app('mine.ts'), 'MineComponent');
      controlAt('/projects/test-app/src/nested/foreign.ts', 'ForeignComponent');

      const registrations = await registeredIn(src(registrationsPath).slice(1));

      expect(registrations).toContain('MineComponent');
      expect(registrations).not.toContain('ForeignComponent');
    });

    it('skips other projects from a project at the workspace root', async () => {
      addRootProject(appTree, 'root-app');
      controlAt('/lib/mine.ts', 'MineComponent');
      controlAt(app('foreign.ts'), 'ForeignComponent');

      const registrations = await registeredIn('registrations.ts', {
        project: 'root-app',
      });

      expect(registrations).toContain('MineComponent');
      expect(registrations).not.toContain('ForeignComponent');
    });
  });

  describe('the base of the discovery globs', () => {
    const spellings = [
      ['relative to the source root', 'app/widgets/**'],
      ['with a leading ./', './app/widgets/**'],
      ['from the workspace root', 'projects/test-app/src/app/widgets/**'],
      ['with a leading /', '/projects/test-app/src/app/widgets/**'],
    ];

    beforeEach(() => {
      provideMap(
        appTree,
        appConfigPathRaw,
        registrationsPath,
        formbarConfigPath,
      );
      appTree.create(
        app('widgets/in.ts'),
        createControlComponent('in', inlineProviders, 'InComponent'),
      );
      appTree.create(
        app('other/out.ts'),
        createControlComponent('out', inlineProviders, 'OutComponent'),
      );
    });

    async function registered(options: Partial<DiscoverOptions>) {
      return read(
        await runSchematic({ registrationType: 'config', ...options }),
        src(registrationsPath),
      );
    }

    it.each(spellings)('--include %s', async (_, glob) => {
      const registrations = await registered({ include: [glob] });

      expect(registrations).toContain('InComponent');
      expect(registrations).not.toContain('OutComponent');
    });

    it.each(spellings)('--exclude %s', async (_, glob) => {
      const registrations = await registered({ exclude: [glob] });

      expect(registrations).not.toContain('InComponent');
      expect(registrations).toContain('OutComponent');
    });

    it.each(spellings)('discovery.include %s', async (_, glob) => {
      writeJson(appTree, src(schematicsConfigPath), {
        discovery: { include: [glob] },
      });

      const registrations = await registered({});

      expect(registrations).toContain('InComponent');
      expect(registrations).not.toContain('OutComponent');
    });

    it.each([
      ['--include', { include: ['**/*.ts'] }],
      ['--exclude', { exclude: [] }],
      ['no pattern', {}],
    ])(
      'finds a file directly in the source root with %s',
      async (_, options) => {
        appTree.create(
          src('top.ts'),
          createControlComponent('top', inlineProviders, 'TopComponent'),
        );

        expect(await registered(options)).toContain('TopComponent');
      },
    );

    it('matches a folder directly in the source root with a leading **', async () => {
      appTree.create(
        src('controls/top.ts'),
        createControlComponent('top', inlineProviders, 'TopComponent'),
      );

      const registrations = await registered({
        include: ['**/controls/**'],
      });

      expect(registrations).toContain('TopComponent');
    });

    it.each([
      ['with a leading /', '/tools/**'],
      ['climbing out of the source root', '../tools/**'],
    ])('fails on an include %s outside the source root', async (_, glob) => {
      await expect(registered({ include: [glob] })).rejects.toThrow(
        `"include" points outside the source root projects/test-app/src: ${glob}`,
      );
    });

    it('fails on the same glob from discovery.include', async () => {
      writeJson(appTree, src(schematicsConfigPath), {
        discovery: { include: ['/tools/**'] },
      });

      await expect(registered({})).rejects.toThrow(
        '"include" points outside the source root',
      );
    });

    it('accepts an exclude outside the source root', async () => {
      expect(await registered({ exclude: ['/tools/**'] })).toContain(
        'InComponent',
      );
    });

    it('only walks the source root, with a glob covering more', async () => {
      appTree.create(
        '/projects/test-app/tools/tool.ts',
        createControlComponent('tool', inlineProviders, 'ToolComponent'),
      );

      const registrations = await registered({ include: ['/**/*.ts'] });

      expect(registrations).toContain('InComponent');
      expect(registrations).not.toContain('ToolComponent');
    });

    it('logs where it looked', async () => {
      const messages: string[] = [];
      runner.logger.subscribe((entry) => messages.push(entry.message));

      await registered({ include: ['app/absent/**'] });

      expect(messages).toContain(
        '0 components discovered in /projects/test-app/src',
      );
    });

    it('fails on a glob above the workspace root', async () => {
      await expect(registered({ include: ['../../../../**'] })).rejects.toThrow(
        '"include" points outside the workspace root',
      );
    });
  });

  describe('the registration key', () => {
    const componentFile = app('widgets/range.ts');
    const key = (name: string) =>
      new RegExp(`["']?${name}["']?:\\s*loadComponent\\(`);

    const nameInput = 'readonly name = input.required<string>();';
    const inheritsOrDeclaresName = (heritage: string) =>
      heritage.startsWith('extends') ? '' : nameInput;

    function componentImplementing(contract: string, importLine = '') {
      return `import { Component, input, OnInit } from '@angular/core';
import { ${contract.split('<')[0]} } from '@ngx-formbar/reactive-forms';
${importLine}

@Component({ selector: 'app-range', template: '' })
export class RangeComponent implements OnInit, ${contract} {
  ${nameInput}
  ngOnInit() {
    return undefined;
  }
}
`;
    }

    async function registered() {
      provideMap(
        appTree,
        appConfigPathRaw,
        registrationsPath,
        formbarConfigPath,
      );

      const tree = await runSchematic({ registrationType: 'config' });

      return read(tree, src(registrationsPath));
    }

    it.each([
      ['control', 'SliderControl'],
      ['group', 'SliderGroup'],
      ['block', 'SliderBlock'],
      ['array', 'SliderArray'],
    ])(
      'is the key a %s was scaffolded with',
      async (schematic, componentClassName) => {
        appTree = await runner.runSchematic(
          schematic,
          { ...baseOptions, key: 'slider', skipRegistration: true },
          appTree,
        );

        const registrations = await registered();

        expect(registrations).toContain(componentClassName);
        expect(registrations).toMatch(key('slider'));
        expect(registrations).not.toMatch(key('slider-[a-z]+'));
      },
    );

    it('is the key of a control named differently', async () => {
      appTree = await runner.runSchematic(
        'control',
        {
          ...baseOptions,
          key: 'slider',
          name: 'fancy',
          skipRegistration: true,
        },
        appTree,
      );

      const registrations = await registered();

      expect(registrations).toContain('FancyControl');
      expect(registrations).toMatch(key('slider'));
    });

    it('reads an interface in the component file', async () => {
      appTree.create(
        componentFile,
        `${componentImplementing('ReactiveFormbarControl<RangeConfig>')}
export interface RangeConfig { type: 'from-same-file'; }
`,
      );

      expect(await registered()).toMatch(key('from-same-file'));
    });

    it.each<[string, string, Record<string, string>]>([
      [
        'an import under another name',
        './range.type',
        {
          'range.type.ts': "export interface Config { type: 'followed'; }\n",
        },
      ],
      [
        'a barrel with export * and a cycle',
        './types',
        {
          'types/index.ts':
            "export * from './index';\nexport * from './one';\n",
          'types/one.ts': "export { Config } from './two';\n",
          'types/two.ts': "export interface Config { type: 'followed'; }\n",
        },
      ],
    ])('follows %s', async (_, specifier, files) => {
      appTree.create(
        componentFile,
        componentImplementing(
          'ReactiveFormbarControl<RangeConfig>',
          `import { Config as RangeConfig } from '${specifier}';`,
        ),
      );

      for (const [file, content] of Object.entries(files)) {
        appTree.create(app(`widgets/${file}`), content);
      }

      expect(await registered()).toMatch(key('followed'));
    });

    it('reads `type` past another literal property', async () => {
      appTree.create(
        componentFile,
        componentImplementing(
          'ReactiveFormbarControl<RangeConfig>',
          "interface RangeConfig { kind?: 'other'; type: 'after-kind'; }",
        ),
      );

      expect(await registered()).toMatch(key('after-kind'));
    });

    it('reads the config of the contract past another generic', async () => {
      appTree.create(
        componentFile,
        `import { Component, input } from '@angular/core';
import { ReactiveFormbarControl } from '@ngx-formbar/reactive-forms';

interface Elsewhere<T> { value?: T; }
interface OtherConfig { type: 'wrong'; }
interface RangeConfig { type: 'right'; }

@Component({ selector: 'app-range', template: '' })
export class RangeComponent implements Elsewhere<OtherConfig>, ReactiveFormbarControl<RangeConfig> {
  ${nameInput}
  value?: OtherConfig;
}
`,
      );

      expect(await registered()).toMatch(key('right'));
    });

    it('reads a config behind a path alias', async () => {
      writeJson(appTree, '/tsconfig.json', {
        compilerOptions: { baseUrl: '.', paths: { '@forms/*': ['forms/*'] } },
      });
      appTree.create(
        '/forms/range.config.ts',
        "export interface RangeConfig { type: 'from-alias'; }\n",
      );
      appTree.create(
        componentFile,
        componentImplementing(
          'ReactiveFormbarControl<RangeConfig>',
          "import { RangeConfig } from '@forms/range.config';",
        ),
      );

      expect(await registered()).toMatch(key('from-alias'));
    });

    it.each<[string, string]>([
      ['an object type', "type RangeConfig = { type: 'declared' };"],
      [
        'an intersection',
        "interface Base { label: string; }\ntype RangeConfig = Base & { type: 'declared' };",
      ],
      [
        'a utility type',
        "interface Base { label: string; type: 'declared'; }\ntype RangeConfig = Omit<Base, 'label'>;",
      ],
    ])('reads a type alias of %s', async (_, line) => {
      appTree.create(
        componentFile,
        componentImplementing('ReactiveFormbarControl<RangeConfig>', line),
      );

      expect(await registered()).toMatch(key('declared'));
    });

    it('reads a type inherited from another interface', async () => {
      appTree.create(
        componentFile,
        componentImplementing(
          'ReactiveFormbarControl<RangeConfig>',
          "interface Base { type: 'inherited'; }\ninterface RangeConfig extends Base {}",
        ),
      );

      expect(await registered()).toMatch(key('inherited'));
    });

    describe('with the package installed', () => {
      beforeEach(() => {
        appTree.create(
          '/node_modules/@ngx-formbar/reactive-forms/index.d.ts',
          'export type ReactiveFormbarControl<T = unknown> = { readonly name: T };\n',
        );
        appTree.create(
          '/node_modules/@ngx-formbar/reactive-forms/package.json',
          JSON.stringify({
            name: '@ngx-formbar/reactive-forms',
            types: 'index.d.ts',
          }),
        );
        appTree.create(
          '/node_modules/@ngx-formbar/core/index.d.ts',
          'export interface NgxFbControl { type: string; label?: string; }\n',
        );
        appTree.create(
          '/node_modules/@ngx-formbar/core/package.json',
          JSON.stringify({ name: '@ngx-formbar/core', types: 'index.d.ts' }),
        );
      });

      it('reads an intersection with a type of the package', async () => {
        appTree.create(
          componentFile,
          componentImplementing(
            'ReactiveFormbarControl<RangeConfig>',
            "import { NgxFbControl } from '@ngx-formbar/core';\ntype RangeConfig = NgxFbControl & { type: 'declared' };",
          ),
        );

        expect(await registered()).toMatch(key('declared'));
      });

      it.each<[string, string, string]>([
        [
          'a local alias',
          'implements MyControl',
          'type MyControl = formbar.ReactiveFormbarControl<RangeConfig>;',
        ],
        [
          'a local interface',
          'implements MyControl',
          'interface MyControl extends formbar.ReactiveFormbarControl<RangeConfig> {}',
        ],
        [
          'a base',
          'extends BaseControl',
          `export abstract class BaseControl implements formbar.ReactiveFormbarControl<RangeConfig> { ${nameInput} }`,
        ],
      ])(
        'finds the contract of a namespace import through %s',
        async (_, heritage, declaration) => {
          appTree.create(
            componentFile,
            `import { Component, input } from '@angular/core';
import * as formbar from '@ngx-formbar/reactive-forms';

interface RangeConfig { type: 'declared'; }
${declaration}

@Component({ selector: 'app-range', template: '' })
export class RangeComponent ${heritage} { ${inheritsOrDeclaresName(heritage)} }
`,
          );

          expect(await registered()).toMatch(key('declared'));
        },
      );

      it.each<[string, string, string, Record<string, string>]>([
        [
          'an import under another name',
          "import { ReactiveFormbarControl as Control } from '@ngx-formbar/reactive-forms';",
          'Control',
          {},
        ],
        [
          'a namespace import',
          "import * as formbar from '@ngx-formbar/reactive-forms';",
          'formbar.ReactiveFormbarControl',
          {},
        ],
        [
          'a barrel renaming it',
          "import { Control } from '../shared';",
          'Control',
          {
            'shared/index.ts':
              "export { ReactiveFormbarControl as Control } from '@ngx-formbar/reactive-forms';\n",
          },
        ],
      ])('finds the contract through %s', async (_, line, used, files) => {
        for (const [file, content] of Object.entries(files)) {
          appTree.create(app(file), content);
        }
        appTree.create(
          componentFile,
          `import { Component, input } from '@angular/core';
${line}

interface RangeConfig { type: 'declared'; }

@Component({ selector: 'app-range', template: '' })
export class RangeComponent implements ${used}<RangeConfig> { ${nameInput} }
`,
        );

        expect(await registered()).toMatch(key('declared'));
      });
    });

    describe('through what the class builds on', () => {
      const contractImport =
        "import { ReactiveFormbarControl } from '@ngx-formbar/reactive-forms';";
      const config = "interface RangeConfig { type: 'declared'; }";

      function component(heritage: string, declarations = '') {
        return `import { Component, Directive, input } from '@angular/core';
import { NgxFbControl } from '@ngx-formbar/core';
${contractImport}
${declarations}
${config}

@Component({ selector: 'app-range', template: '' })
export class RangeComponent ${heritage} { ${inheritsOrDeclaresName(heritage)} }
`;
      }

      const stating = (name: string, stated: string) => `@Directive()
export abstract class ${name} implements ReactiveFormbarControl<${stated}> { ${nameInput} }`;

      const stated = stating('StatedControl', 'RangeConfig');
      const loose = stating('LooseControl', '{ type: string }');
      const mixin = (body: string, heritage = '') =>
        `type Constructor = abstract new (...args: any[]) => object;
abstract class Plain {}
function withMixin<T extends Constructor>(Base: T) {
  abstract class Mixed extends Base ${heritage} { ${body} }
  return Mixed;
}`;
      const contractMixin = mixin(
        nameInput,
        'implements ReactiveFormbarControl<RangeConfig>',
      );

      it.each<[string, string, string]>([
        ['a base stating the config', 'extends StatedControl', stated],
        [
          'a two-level base stating the config',
          'extends MiddleControl',
          `${stated}
@Directive()
export abstract class MiddleControl extends StatedControl {}`,
        ],
        [
          'a generic base over one stating the config',
          'extends MiddleControl<string>',
          `${stated}
@Directive()
export abstract class MiddleControl<V> extends StatedControl { value?: V; }`,
        ],
        ['a mixin call', 'extends withMixin(Plain)', contractMixin],
        [
          'a variable holding a mixin call',
          'extends Mixin',
          `${contractMixin}\nconst Mixin = withMixin(Plain);`,
        ],
        [
          'a variable holding a class',
          'extends Base',
          `const Base = class implements ReactiveFormbarControl<RangeConfig> { ${nameInput} };`,
        ],
        [
          'a utility type',
          'implements Partial<ReactiveFormbarControl<RangeConfig>>',
          '',
        ],
        [
          'nested utility types',
          'implements Readonly<Partial<ReactiveFormbarControl<RangeConfig>>>',
          '',
        ],
        [
          'a utility type in a local alias',
          'implements MyControl',
          "type MyControl = Omit<ReactiveFormbarControl<RangeConfig>, 'errors'>;",
        ],
        [
          'a utility type in a local interface',
          'implements MyControl',
          "interface MyControl extends Omit<ReactiveFormbarControl<RangeConfig>, 'errors'> {}",
        ],
        [
          'a utility type in a generic local alias',
          'implements MyControl<RangeConfig>',
          "type MyControl<C extends NgxFbControl> = Omit<ReactiveFormbarControl<C>, 'errors'>;",
        ],
        [
          'a local interface',
          'implements MyControl',
          'interface MyControl extends ReactiveFormbarControl<RangeConfig> {}',
        ],
        [
          'a local alias',
          'implements MyControl',
          'type MyControl = ReactiveFormbarControl<RangeConfig>;',
        ],
        [
          'a generic local alias',
          'implements MyControl<RangeConfig>',
          'type MyControl<C extends NgxFbControl> = ReactiveFormbarControl<C>;',
        ],
        [
          'a local alias with a default config',
          'implements MyControl',
          'type MyControl<C extends NgxFbControl = RangeConfig> = ReactiveFormbarControl<C>;',
        ],
        [
          'an intersection in a local alias',
          'implements MyControl',
          'type MyControl = { label?: string } & ReactiveFormbarControl<RangeConfig>;',
        ],
        [
          'a base and its own contract',
          'extends LooseControl implements ReactiveFormbarControl<RangeConfig>',
          loose,
        ],
        [
          'a base when its own contract has no literal',
          'extends StatedControl implements ReactiveFormbarControl<{ type: string }>',
          stated,
        ],
        [
          'a base and another literal in its own contract',
          'extends OtherControl implements ReactiveFormbarControl<RangeConfig>',
          stating('OtherControl', "{ type: 'other' }"),
        ],
      ])('finds the contract through %s', async (_, heritage, declarations) => {
        appTree.create(componentFile, component(heritage, declarations));

        expect(await registered()).toMatch(key('declared'));
      });

      it('finds the contract through a base in another file', async () => {
        appTree.create(
          app('widgets/base-control.ts'),
          `${contractImport}
import { Directive, input } from '@angular/core';

${config}

${stated}
`,
        );
        appTree.create(
          app('widgets/middle-control.ts'),
          `import { Directive } from '@angular/core';
import { StatedControl } from './base-control';

@Directive()
export abstract class MiddleControl extends StatedControl {}
`,
        );
        appTree.create(
          componentFile,
          `import { Component } from '@angular/core';
import { MiddleControl } from './middle-control';

@Component({ selector: 'app-range', template: '' })
export class RangeComponent extends MiddleControl {}
`,
        );

        expect(await registered()).toMatch(key('declared'));
      });

      it.each<[string, string, string]>([
        ['a base that fixes no type literal', 'extends LooseControl', loose],
        [
          'a type argument wrapped in the alias',
          'implements MyControl<RangeConfig>',
          'type MyControl<C extends NgxFbControl> = ReactiveFormbarControl<Readonly<C>>;',
        ],
      ])(
        'falls back to the class name with %s',
        async (_, heritage, declarations) => {
          appTree.create(componentFile, component(heritage, declarations));
          const warnings: string[] = [];
          runner.logger.subscribe((entry) => {
            if (entry.level === 'warn') {
              warnings.push(entry.message);
            }
          });

          expect(await registered()).toMatch(key('range'));
          expect(warnings).toContain(
            'RangeComponent has no single string `type` in its config, so it is registered as "range".',
          );
        },
      );

      it.each<[string, string, string]>([
        [
          'a base without a contract',
          'extends PlainBase',
          '@Directive()\nexport abstract class PlainBase<T = RangeConfig> {}',
        ],
        [
          'a mixin without a contract',
          `extends withMixin(Plain)`,
          mixin(nameInput),
        ],
        [
          'a variable holding a class without a contract',
          'extends Base',
          `const Base = class { ${nameInput} };`,
        ],
        [
          'an interface without a contract',
          'implements Plain',
          'interface Plain { readonly name: unknown; }',
        ],
        [
          'an alias without a contract',
          'implements Plain',
          'type Plain = { readonly name: unknown };',
        ],
        [
          'a contract only in a type argument',
          'implements Holder<ReactiveFormbarControl<RangeConfig>>',
          'interface Holder<T> { readonly name: unknown; held?: T; }',
        ],
        [
          'a contract only in a local generic named like a utility type',
          'implements Partial<ReactiveFormbarControl<RangeConfig>>',
          'interface Partial<T> { readonly name: unknown; held?: T; }',
        ],
        [
          'interfaces extending each other',
          'implements First',
          'interface First extends Second {}\ninterface Second extends First {}',
        ],
      ])('skips a component with %s', async (_, heritage, declarations) => {
        appTree.create(componentFile, component(heritage, declarations));

        expect(await registered()).not.toContain('RangeComponent');
      });
    });

    it.each<[string, string, string]>([
      [
        'an interface it cannot find',
        'ReactiveFormbarControl<MissingConfig>',
        "import { MissingConfig } from './missing';",
      ],
      [
        'an interface without a type literal',
        'ReactiveFormbarControl<LooseConfig>',
        'interface LooseConfig { type: string; }',
      ],
      [
        'a package interface',
        'ReactiveFormbarControl<PackageConfig>',
        "import { PackageConfig } from 'some-package';",
      ],
      [
        'several possible types',
        'ReactiveFormbarControl<LooseConfig>',
        "interface LooseConfig { type: 'a' | 'b'; }",
      ],
      ['no config type', 'ReactiveFormbarControl', ''],
    ])('falls back to the class name with %s', async (_, contract, line) => {
      appTree.create(componentFile, componentImplementing(contract, line));
      const warnings: string[] = [];
      runner.logger.subscribe((entry) => {
        if (entry.level === 'warn') {
          warnings.push(entry.message);
        }
      });

      expect(await registered()).toMatch(key('range'));
      expect(warnings).toContain(
        'RangeComponent has no single string `type` in its config, so it is registered as "range".',
      );
    });
  });

  describe('a component that is already registered', () => {
    function logged(level: string) {
      const messages: string[] = [];
      runner.logger.subscribe((entry) => {
        if (entry.level === level) {
          messages.push(entry.message);
        }
      });

      return messages;
    }

    it.each<['token' | 'config', () => void]>([
      [
        'token',
        () => {
          provideToken(appTree, appConfigPathRaw, registrationsPath);
        },
      ],
      [
        'config',
        () => {
          provideMap(
            appTree,
            appConfigPathRaw,
            registrationsPath,
            formbarConfigPath,
          );
        },
      ],
    ])(
      'is logged at info level on a %s re-run',
      async (registrationType, provide) => {
        appTree.create(
          app('one/one-control.ts'),
          createControlComponent('one', inlineProviders, 'OneControl'),
        );
        provide();
        appTree = await runSchematic({ registrationType });

        const warnings = logged('warn');
        const infos = logged('info');

        await runSchematic({ registrationType });

        const alreadyUsed =
          'A component with the name "OneControl" is already used';

        expect(warnings).not.toContain(alreadyUsed);
        expect(infos).toContain(alreadyUsed);
      },
    );

    it('still warns when another component holds the key', async () => {
      const component = (className: string) =>
        `import { Component, input } from '@angular/core';
import { ReactiveFormbarControl } from '@ngx-formbar/reactive-forms';

interface SharedConfig { type: 'shared'; }

@Component({ selector: 'app-x', template: '' })
export class ${className} implements ReactiveFormbarControl<SharedConfig> {
  readonly name = input.required<string>();
}
`;
      appTree.create(app('one/one-control.ts'), component('OneControl'));
      appTree.create(app('two/two-control.ts'), component('TwoControl'));
      provideToken(appTree, appConfigPathRaw, registrationsPath);

      const warnings = logged('warn');

      await runSchematic();

      expect(warnings).toEqual([
        'A key with the name "shared" is already used',
      ]);
    });
  });

  it('honors the registrationType option when no config file is present', async () => {
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
    provideMap(appTree, appConfigPathRaw, registrationsPath, formbarConfigPath);

    const tree = await runSchematic({ registrationType: 'config' });

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

      const hasStaticImport = hasNamedImport(
        componentRegistrationsSf,
        componentImportPath,
        className,
      );
      const hasDynamicImport = hasDynamicImportOf(
        componentRegistrationsSf,
        className,
      );
      const hasRegistration = hasRegistrationFn(
        componentRegistrationsSf,
        key,
        className,
      );
      const message = `${className} - ${key} - ${shouldRegister.toString()}`;
      expect(hasStaticImport, message).toBe(false);
      expect(hasDynamicImport, message).toBe(shouldRegister);
      expect(hasRegistration, message).toBe(shouldRegister);
    },
  );
}
