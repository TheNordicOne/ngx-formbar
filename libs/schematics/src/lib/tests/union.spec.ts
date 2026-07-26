import { beforeEach, describe, expect, it } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import {
  addCoreStub,
  COLLECTION_PATH,
  setupWorkspace,
} from './workspace-setup';
import { app, read, writeJson } from './helper';

describe('scaffolding updates the content union', () => {
  let runner: SchematicTestRunner;
  let tree: UnitTestTree;

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);
    tree = await setupWorkspace(runner);
    tree.create(
      app('types/content.type.ts'),
      `export type AppContent = never;\n`,
    );
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: { type: 'app/types/content.type.ts#AppContent' },
    });
  });

  it('adds a scaffolded control to the union', async () => {
    const result = await runner.runSchematic(
      'control',
      { key: 'slider', project: 'test-app' },
      tree,
    );

    const union = read(result, app('types/content.type.ts'));

    expect(union).toContain(
      "import { SliderControlConfig } from '../slider/slider-control-config';",
    );
    expect(union).toContain('export type AppContent = SliderControlConfig;');
  });

  it('adds a scaffolded group with the union as its type argument', async () => {
    const result = await runner.runSchematic(
      'group',
      { key: 'section', project: 'test-app' },
      tree,
    );

    expect(read(result, app('types/content.type.ts'))).toContain(
      'SectionGroupConfig<AppContent>',
    );
  });

  it('appends to a union that already has members', async () => {
    const withSlider = await runner.runSchematic(
      'control',
      { key: 'slider', project: 'test-app' },
      tree,
    );
    const result = await runner.runSchematic(
      'control',
      { key: 'toggle', project: 'test-app' },
      withSlider,
    );

    const union = read(result, app('types/content.type.ts'));

    expect(union).toContain(
      "import { ToggleControlConfig } from '../toggle/toggle-control-config';",
    );
    expect(union).toContain(
      'export type AppContent = SliderControlConfig\n  | ToggleControlConfig;',
    );
  });

  it('leaves a union the schema schematic can resolve', async () => {
    addCoreStub(tree);
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: {
        type: 'app/types/content.type.ts#AppContent',
        emitters: [{ use: 'json-schema-2020-12', output: 'form.schema.json' }],
      },
    });

    const withControl = await runner.runSchematic(
      'control',
      { key: 'slider', project: 'test-app' },
      tree,
    );
    const withGroup = await runner.runSchematic(
      'group',
      { key: 'section', project: 'test-app' },
      withControl,
    );
    const result = await runner.runSchematic(
      'schema',
      { project: 'test-app' },
      withGroup,
    );

    const document = JSON.parse(
      read(result, '/projects/test-app/src/form.schema.json'),
    ) as { $defs?: Record<string, unknown> };

    expect(document.$defs).toHaveProperty('SliderControlConfig');
    expect(document.$defs).toHaveProperty('SectionGroupConfig');
  });

  it('does nothing when no schema type is configured', async () => {
    writeJson(tree, app('formbar-schematic.config.json'), {});

    const result = await runner.runSchematic(
      'control',
      { key: 'slider', project: 'test-app' },
      tree,
    );

    expect(read(result, app('types/content.type.ts'))).toBe(
      'export type AppContent = never;\n',
    );
  });
});
