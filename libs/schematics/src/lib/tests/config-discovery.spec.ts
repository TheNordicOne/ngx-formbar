import { beforeEach, describe, expect, it } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { NgxFormbarAutomationConfig } from '@ngx-formbar/setup';
import {
  addRootProject,
  COLLECTION_PATH,
  setupWorkspace,
} from './workspace-setup';
import { app, appRoot, exists, read, src, writeJson } from './helper';

const widgetConfig: NgxFormbarAutomationConfig = {
  control: { componentSuffix: 'Widget' },
};

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

  it("replaces the workspace root config with the project's own, without merging", async () => {
    writeJson(tree, '/formbar-schematic.config.json', {
      control: { componentSuffix: 'Ignored', interfaceSuffix: 'Ignored' },
    });
    writeJson(tree, app('formbar-schematic.config.json'), widgetConfig);

    const result = await scaffoldSlider();

    expect(usedConfig(result)).toBe(true);
    expect(
      result.files
        .filter((file) => file.startsWith(app('slider/')))
        .some((file) => read(result, file).includes('Ignored')),
    ).toBe(false);
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
