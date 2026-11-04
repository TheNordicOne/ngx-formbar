import { beforeEach, describe, expect, it } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { NgxFormbarAutomationConfig } from '@ngx-formbar/setup';
import {
  addCoreStub,
  addReactiveFormsStub,
  addRootProject,
  COLLECTION_PATH,
  provideToken,
  setupWorkspace,
} from './workspace-setup';
import { app, appRoot, exists, read, src, writeJson } from './helper';

const widgetConfig: NgxFormbarAutomationConfig = {
  control: { componentSuffix: 'Widget' },
};

function controlComponent(className: string, type: string) {
  return `import { Component, input } from '@angular/core';
import { ReactiveFormbarControl } from '@ngx-formbar/reactive-forms';

interface Config { type: '${type}'; }

@Component({ selector: 'app-${type}', template: '' })
export class ${className} implements ReactiveFormbarControl<Config> {
  readonly name = input.required<string>();
}
`;
}

describe('schematics configuration file lookup', () => {
  let runner: SchematicTestRunner;
  let tree: UnitTestTree;

  async function scaffoldSlider() {
    return runner.runSchematic(
      'control',
      { key: 'slider', project: 'test-app' },
      tree,
    );
  }

  function usedConfig(result: UnitTestTree) {
    return exists(result, app('slider/slider-widget.ts'));
  }

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);
    tree = await setupWorkspace(runner);
  });

  it('finds the config in the app folder of the source root', async () => {
    writeJson(tree, app('formbar-schematic.config.json'), widgetConfig);

    expect(usedConfig(await scaffoldSlider())).toBe(true);
  });

  it('falls back to the config at the workspace root', async () => {
    writeJson(tree, '/formbar-schematic.config.json', widgetConfig);

    expect(usedConfig(await scaffoldSlider())).toBe(true);
  });

  describe('with a file over the workspace root config', () => {
    const shared = '/formbar-schematic.config.json';
    const interfaceOfSlider = (result: UnitTestTree, suffix: string) =>
      read(result, app(`slider/slider-${suffix}.ts`));

    it('merges per key inside a section', async () => {
      writeJson(tree, shared, {
        control: { componentSuffix: 'Ignored', interfaceSuffix: 'Inherited' },
      });
      writeJson(tree, app('formbar-schematic.config.json'), widgetConfig);

      const result = await scaffoldSlider();

      expect(usedConfig(result)).toBe(true);
      expect(interfaceOfSlider(result, 'widget')).toContain('Inherited');
    });

    it('inherits a setting the file does not state', async () => {
      writeJson(tree, shared, widgetConfig);
      writeJson(tree, app('formbar-schematic.config.json'), {
        registrationType: 'config',
      });

      expect(usedConfig(await scaffoldSlider())).toBe(true);
    });

    it('removes an inherited setting with null', async () => {
      writeJson(tree, shared, widgetConfig);
      writeJson(tree, app('formbar-schematic.config.json'), {
        control: { componentSuffix: null },
      });

      expect(usedConfig(await scaffoldSlider())).toBe(false);
    });

    it('replaces an inherited array', async () => {
      tree.create(app('one/one.ts'), controlComponent('OneControl', 'one'));
      tree.create(app('two/two.ts'), controlComponent('TwoControl', 'two'));
      addCoreStub(tree);
      addReactiveFormsStub(tree);
      writeJson(tree, shared, { discovery: { include: ['app/one/**'] } });
      writeJson(tree, app('formbar-schematic.config.json'), {
        discovery: { include: ['app/two/**'] },
      });
      provideToken(
        tree,
        'app.config.ts',
        'app/registrations/component-registrations.ts',
      );

      const result = await runner.runSchematic(
        'register',
        { project: 'test-app' },
        tree,
      );
      const registrations = read(
        result,
        src('app/registrations/component-registrations.ts'),
      );

      expect(registrations).toContain('TwoControl');
      expect(registrations).not.toContain('OneControl');
    });

    it('inherits with an explicit --schematicsConfig too', async () => {
      writeJson(tree, shared, widgetConfig);
      writeJson(tree, src('config/custom.json'), {
        registrationType: 'config',
      });

      const result = await runner.runSchematic(
        'control',
        {
          key: 'slider',
          project: 'test-app',
          schematicsConfig: 'config/custom.json',
        },
        tree,
      );

      expect(usedConfig(result)).toBe(true);
    });

    it('logs both files', async () => {
      const messages: string[] = [];
      runner.logger.subscribe(({ message }) => messages.push(message));
      writeJson(tree, shared, widgetConfig);
      writeJson(tree, app('formbar-schematic.config.json'), {});

      await scaffoldSlider();

      expect(messages).toContain(
        `Using schematics configuration file ${app('formbar-schematic.config.json')} over ${shared}`,
      );
    });
  });

  it('prefers an explicit --schematicsConfig over both locations', async () => {
    writeJson(tree, '/formbar-schematic.config.json', {});
    writeJson(tree, app('formbar-schematic.config.json'), {});
    writeJson(tree, src('config/custom.json'), widgetConfig);

    const result = await runner.runSchematic(
      'control',
      {
        key: 'slider',
        project: 'test-app',
        schematicsConfig: 'config/custom.json',
      },
      tree,
    );

    expect(usedConfig(result)).toBe(true);
  });

  it('uses the workspace root config when another project is rooted there', async () => {
    addRootProject(tree, 'root-app');
    writeJson(tree, '/formbar-schematic.config.json', widgetConfig);

    expect(usedConfig(await scaffoldSlider())).toBe(true);
  });

  it('uses the workspace root config for the project rooted there', async () => {
    addRootProject(tree, 'root-app');
    writeJson(tree, '/formbar-schematic.config.json', widgetConfig);

    const result = await runner.runSchematic(
      'control',
      { key: 'slider', project: 'root-app' },
      tree,
    );

    expect(exists(result, '/app/slider/slider-widget.ts')).toBe(true);
  });

  it.each([
    src('formbar-schematic.config.json'),
    src('forms/formbar-schematic.config.json'),
    app('management/forms/formbar-schematic.config.json'),
    appRoot('formbar-schematic.config.json'),
    '/projects/other-app/src/app/formbar-schematic.config.json',
    '/node_modules/some-package/formbar-schematic.config.json',
  ])('does not find a config at %s', async (path) => {
    writeJson(tree, path, widgetConfig);

    const result = await scaffoldSlider();

    expect(usedConfig(result)).toBe(false);
    expect(exists(result, app('slider/slider-control.ts'))).toBe(true);
  });

  describe('logging', () => {
    async function logged(schematic: string, options: object) {
      const messages: string[] = [];
      const subscription = runner.logger.subscribe((entry) => {
        messages.push(entry.message);
      });

      await runner
        .runSchematic(schematic, { project: 'test-app', ...options }, tree)
        .catch(() => undefined);
      subscription.unsubscribe();

      return messages;
    }

    const schematics: [string, object][] = [
      ['control', { key: 'slider' }],
      ['group', { key: 'slider' }],
      ['block', { key: 'slider' }],
      ['array', { key: 'slider' }],
      ['register', {}],
      ['schema', {}],
    ];

    it.each(schematics)(
      'the %s schematic logs the config it used',
      async (schematic, options) => {
        const path = app('formbar-schematic.config.json');
        writeJson(tree, path, {});

        expect(await logged(schematic, options)).toContain(
          `Using schematics configuration file ${path}`,
        );
      },
    );

    it.each(schematics)(
      'the %s schematic logs that it found no config',
      async (schematic, options) => {
        expect(await logged(schematic, options)).toContain(
          `No schematics configuration file found. Looked for ${app('formbar-schematic.config.json')} and /formbar-schematic.config.json`,
        );
      },
    );

    it('logs an explicit --schematicsConfig', async () => {
      writeJson(tree, src('config/custom.json'), {});

      expect(
        await logged('control', {
          key: 'slider',
          schematicsConfig: 'config/custom.json',
        }),
      ).toContain(
        `Using schematics configuration file ${src('config/custom.json')}`,
      );
    });
  });

  it.each([
    ['starts with the source root', 'projects/test-app/src/config/custom.json'],
    ['starts with a slash', '/projects/test-app/src/config/custom.json'],
  ])(
    'reads an explicit --schematicsConfig path that %s as given',
    async (_, schematicsConfig) => {
      writeJson(tree, src('config/custom.json'), widgetConfig);

      const result = await runner.runSchematic(
        'control',
        { key: 'slider', project: 'test-app', schematicsConfig },
        tree,
      );

      expect(usedConfig(result)).toBe(true);
    },
  );

  it('fails naming the resolved path when the explicit --schematicsConfig is missing', async () => {
    writeJson(tree, app('formbar-schematic.config.json'), widgetConfig);

    await expect(
      runner.runSchematic(
        'control',
        {
          key: 'slider',
          project: 'test-app',
          schematicsConfig: 'config/missing.json',
        },
        tree,
      ),
    ).rejects.toThrow(
      'Schematics configuration file not found: /projects/test-app/src/config/missing.json',
    );
  });

  it.each([
    ['control', { key: 'slider' }],
    ['register', {}],
    ['schema', {}],
  ])(
    'fails the %s schematic on a --schematicsConfig above the workspace root',
    async (schematic, options) => {
      await expect(
        runner.runSchematic(
          schematic,
          {
            ...options,
            project: 'test-app',
            schematicsConfig: '../../../../missing.json',
          },
          tree,
        ),
      ).rejects.toThrow(
        'Schematics configuration file not found: ../../../../missing.json',
      );
    },
  );
});
