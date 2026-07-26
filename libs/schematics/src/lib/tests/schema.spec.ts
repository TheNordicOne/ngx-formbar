import { beforeEach, describe, expect, it } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import {
  COLLECTION_PATH,
  setupWorkspace,
  addCoreStub,
} from './workspace-setup';
import { app, read, writeJson } from './helper';
import { DRAFT_07, DRAFT_2020_12 } from '../schema/emitter/json-schema/build';

interface EmittedSchemaDocument {
  $schema: string;
  $defs?: Record<string, unknown>;
  definitions?: Record<string, unknown>;
}

function readSchema(result: UnitTestTree, path: string): EmittedSchemaDocument {
  return JSON.parse(read(result, path)) as EmittedSchemaDocument;
}

describe('schema schematic', () => {
  let runner: SchematicTestRunner;
  let tree: UnitTestTree;

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);
    tree = await setupWorkspace(runner);
  });

  it('fails when no type reference is configured', async () => {
    await expect(
      runner.runSchematic('schema', { project: 'test-app' }, tree),
    ).rejects.toThrow(/No content type configured/);
  });

  it('writes one file per configured emitter', async () => {
    addCoreStub(tree);
    tree.create(
      app('types/content.type.ts'),
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export type AppContent = TextControl;
`,
    );
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: {
        type: 'app/types/content.type.ts#AppContent',
        emitters: [
          { use: 'json-schema-2020-12', output: 'form.schema.json' },
          { use: 'json-schema-draft-07', output: 'form.draft-07.json' },
        ],
      },
    });

    const messages: string[] = [];
    runner.logger.subscribe((entry) => messages.push(entry.message));

    const result = await runner.runSchematic(
      'schema',
      { project: 'test-app' },
      tree,
    );

    expect(result.exists('/projects/test-app/src/form.schema.json')).toBe(true);
    expect(result.exists('/projects/test-app/src/form.draft-07.json')).toBe(
      true,
    );

    // Proves per-entry dispatch: each entry's own emitter ran, not the same
    // one twice.
    const modern = readSchema(
      result,
      '/projects/test-app/src/form.schema.json',
    );
    const legacy = readSchema(
      result,
      '/projects/test-app/src/form.draft-07.json',
    );
    expect(modern.$schema).toBe(DRAFT_2020_12.id);
    expect(legacy.$schema).toBe(DRAFT_07.id);

    // Proves a real model flowed through, not an empty one.
    expect(modern.$defs).toHaveProperty('TextControl');
    expect(legacy.definitions).toHaveProperty('TextControl');

    expect(
      messages.some(
        (message) =>
          message.includes('json-schema-2020-12') &&
          message.includes('form.schema.json'),
      ),
    ).toBe(true);
  });

  it('writes to a workspace-absolute output path', async () => {
    addCoreStub(tree);
    tree.create(
      app('types/content.type.ts'),
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export type AppContent = TextControl;
`,
    );
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: {
        type: 'app/types/content.type.ts#AppContent',
        emitters: [
          { use: 'json-schema-2020-12', output: '/dist/form.schema.json' },
        ],
      },
    });

    const result = await runner.runSchematic(
      'schema',
      { project: 'test-app' },
      tree,
    );

    expect(result.exists('/dist/form.schema.json')).toBe(true);
  });

  it('fails when --output is set and more than one emitter is selected', async () => {
    addCoreStub(tree);
    tree.create(
      app('types/content.type.ts'),
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export type AppContent = TextControl;
`,
    );
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: {
        type: 'app/types/content.type.ts#AppContent',
        emitters: [
          { use: 'json-schema-2020-12', output: 'form.schema.json' },
          { use: 'json-schema-draft-07', output: 'form.draft-07.json' },
        ],
      },
    });

    await expect(
      runner.runSchematic(
        'schema',
        { project: 'test-app', output: 'form.schema.json' },
        tree,
      ),
    ).rejects.toThrow(/--emitter/);
  });

  it('runs only the emitters named by --emitter', async () => {
    addCoreStub(tree);
    tree.create(
      app('types/content.type.ts'),
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export type AppContent = TextControl;
`,
    );
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: {
        type: 'app/types/content.type.ts#AppContent',
        emitters: [
          { use: 'json-schema-2020-12', output: 'form.schema.json' },
          { use: 'json-schema-draft-07', output: 'form.draft-07.json' },
        ],
      },
    });

    const result = await runner.runSchematic(
      'schema',
      { project: 'test-app', emitter: ['json-schema-2020-12'] },
      tree,
    );

    expect(result.exists('/projects/test-app/src/form.schema.json')).toBe(true);
    expect(result.exists('/projects/test-app/src/form.draft-07.json')).toBe(
      false,
    );
  });

  it('warns when a required property has no JSON representation', async () => {
    addCoreStub(tree);
    tree.create(
      app('types/content.type.ts'),
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface CallbackControl extends NgxFbControl {
  type: 'callback';
  onPick: (value: string) => void;
  onHover?: (value: string) => void;
}
export type AppContent = CallbackControl;
`,
    );
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: {
        type: 'app/types/content.type.ts#AppContent',
        emitters: [{ use: 'json-schema-2020-12', output: 'form.schema.json' }],
      },
    });

    const messages: string[] = [];
    runner.logger.subscribe((entry) => messages.push(entry.message));

    await runner.runSchematic('schema', { project: 'test-app' }, tree);

    expect(
      messages.some((message) => message.includes('CallbackControl.onPick')),
    ).toBe(true);
    // An optional property with no JSON representation is not unsatisfiable.
    // The config can simply omit it, so it must not warn.
    expect(
      messages.some((message) => message.includes('CallbackControl.onHover')),
    ).toBe(false);
  });

  it('fails when an emitter name is not resolvable', async () => {
    addCoreStub(tree);
    tree.create(
      app('types/content.type.ts'),
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export type AppContent = TextControl;
`,
    );
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: {
        type: 'app/types/content.type.ts#AppContent',
        emitters: [{ use: 'does-not-exist' }],
      },
    });

    await expect(
      runner.runSchematic('schema', { project: 'test-app' }, tree),
    ).rejects.toThrow(/does-not-exist/);
  });
});
