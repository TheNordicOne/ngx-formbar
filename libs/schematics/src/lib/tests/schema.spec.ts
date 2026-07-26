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
import { app, writeJson } from './helper';

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

    const result = await runner.runSchematic(
      'schema',
      { project: 'test-app' },
      tree,
    );

    expect(result.exists('/projects/test-app/src/form.schema.json')).toBe(true);
    expect(result.exists('/projects/test-app/src/form.draft-07.json')).toBe(
      true,
    );
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
      `import { NgxFbControl, Expression } from '@ngx-formbar/core';
export interface CallbackControl extends NgxFbControl {
  type: 'callback';
  onPick: (value: string) => void;
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
