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
import { app, appRoot, exists, read, writeJson } from './helper';

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

  it('adds a member whose name already appears as an unrelated import', async () => {
    tree.overwrite(
      app('types/content.type.ts'),
      `import { SliderControlConfig } from '../slider/slider-control-config';\nexport type AppContent = never;\n`,
    );

    const result = await runner.runSchematic(
      'control',
      { key: 'slider', project: 'test-app' },
      tree,
    );

    expect(read(result, app('types/content.type.ts'))).toContain(
      'export type AppContent = SliderControlConfig;',
    );
  });

  it('resolves a schema.type path written with a "./" prefix', async () => {
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: { type: './app/types/content.type.ts#AppContent' },
    });

    const result = await runner.runSchematic(
      'control',
      { key: 'slider', project: 'test-app' },
      tree,
    );

    expect(read(result, app('types/content.type.ts'))).toContain(
      "import { SliderControlConfig } from '../slider/slider-control-config';",
    );
  });

  it('resolves a schema.type path that walks up a directory', async () => {
    tree.create(
      appRoot('shared/types/content.type.ts'),
      `export type AppContent = never;\n`,
    );
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: { type: '../shared/types/content.type.ts#AppContent' },
    });

    const result = await runner.runSchematic(
      'control',
      { key: 'slider', project: 'test-app' },
      tree,
    );

    const union = read(result, appRoot('shared/types/content.type.ts'));

    expect(union).toContain("SliderControlConfig } from '");
    expect(union).toContain('export type AppContent = SliderControlConfig;');
  });
});

describe('degrades gracefully when the union cannot be updated', () => {
  let runner: SchematicTestRunner;
  let tree: UnitTestTree;

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);
    tree = await setupWorkspace(runner);
    tree.create(
      app('types/content.type.ts'),
      `export type AppContent = never;\n`,
    );
  });

  it('warns and still scaffolds when schema.type is malformed', async () => {
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: { type: 'app/types/content.type.ts' },
    });

    const messages: string[] = [];
    runner.logger.subscribe((entry) => messages.push(entry.message));

    const result = await runner.runSchematic(
      'control',
      { key: 'slider', project: 'test-app' },
      tree,
    );

    expect(exists(result, app('slider/slider-control.ts'))).toBe(true);
    expect(read(result, app('types/content.type.ts'))).toBe(
      'export type AppContent = never;\n',
    );
    expect(messages.some((m) => m.includes('Invalid type reference'))).toBe(
      true,
    );
  });

  it('warns and still scaffolds when the referenced union file does not exist', async () => {
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: { type: 'app/types/missing.type.ts#AppContent' },
    });

    const messages: string[] = [];
    runner.logger.subscribe((entry) => messages.push(entry.message));

    const result = await runner.runSchematic(
      'control',
      { key: 'slider', project: 'test-app' },
      tree,
    );

    expect(exists(result, app('slider/slider-control.ts'))).toBe(true);
    expect(messages.some((m) => m.includes('Union file not found'))).toBe(true);
  });

  it('warns and still scaffolds when the union has no matching type alias', async () => {
    tree.overwrite(
      app('types/content.type.ts'),
      `export type SomethingElse = never;\n`,
    );
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: { type: 'app/types/content.type.ts#AppContent' },
    });

    const messages: string[] = [];
    runner.logger.subscribe((entry) => messages.push(entry.message));

    const result = await runner.runSchematic(
      'control',
      { key: 'slider', project: 'test-app' },
      tree,
    );

    expect(exists(result, app('slider/slider-control.ts'))).toBe(true);
    expect(
      messages.some((m) => m.includes('no type alias named "AppContent"')),
    ).toBe(true);
  });
});
