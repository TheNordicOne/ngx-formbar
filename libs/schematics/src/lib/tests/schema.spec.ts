import { lastValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import {
  COLLECTION_PATH,
  setupWorkspace,
  addCoreStub,
  addProject,
} from './workspace-setup';
import { SchematicsException } from '@angular-devkit/schematics';
import { app, appRoot, read, src, writeJson } from './helper';
import { DRAFT_07, DRAFT_2020_12 } from '../schema/emitter/json-schema/build';
import { schema } from '../schema';

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
  const tempRoots: string[] = [];

  /** A union that reaches its member only through the `@shared` alias. */
  function writeAliasedUnion(sourceRoot: string) {
    tree.create(
      '/shared/text.ts',
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
`,
    );
    tree.create(
      `${sourceRoot}/content.ts`,
      `import { TextControl } from '@shared/text';
export type AppContent = TextControl;
`,
    );
    writeJson(tree, `${sourceRoot}/app/formbar-schematic.config.json`, {
      schema: {
        type: 'content.ts#AppContent',
        emitters: [{ use: 'json-schema-2020-12', output: 'form.schema.json' }],
      },
    });
  }

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);
    tree = await setupWorkspace(runner);
  });

  afterEach(() => {
    vi.restoreAllMocks();

    for (const root of tempRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails when no type reference is configured', async () => {
    await expect(
      runner.runSchematic('schema', { project: 'test-app' }, tree),
    ).rejects.toThrow(/No content type configured/);
  });

  it('fails on a config without a schema section when no type is passed', async () => {
    writeJson(tree, app('formbar-schematic.config.json'), {});

    await expect(
      runner.runSchematic('schema', { project: 'test-app' }, tree),
    ).rejects.toThrow(/No content type configured/);
  });

  it.each([
    ['no config file', false],
    ['a config without a schema section', true],
  ])('writes nothing with --type and %s', async (_, hasConfig) => {
    if (hasConfig) {
      writeJson(tree, app('formbar-schematic.config.json'), {});
    }

    const messages: string[] = [];
    runner.logger.subscribe((entry) => messages.push(entry.message));

    await runner.runSchematic(
      'schema',
      { project: 'test-app', type: 'app/types/content.type.ts#AppContent' },
      tree,
    );

    expect(messages).toContain(
      'No emitters configured in "schema.emitters". Nothing was written.',
    );
  });

  it('treats an --emitter the option schema never defaulted as no filter', async () => {
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: { type: 'app/types/content.type.ts#AppContent' },
    });

    await expect(
      lastValueFrom(runner.callRule(schema({ project: 'test-app' }), tree)),
    ).resolves.toBeDefined();
  });

  it('fails with a helpful message when the content union is empty', async () => {
    addCoreStub(tree);
    tree.create(
      app('types/content.type.ts'),
      'export type AppContent = never;\n',
    );
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: {
        type: 'app/types/content.type.ts#AppContent',
        emitters: [{ use: 'json-schema-2020-12', output: 'form.schema.json' }],
      },
    });

    await expect(
      runner.runSchematic('schema', { project: 'test-app' }, tree),
    ).rejects.toThrow(/"AppContent"[\s\S]*no members[\s\S]*scaffold/i);
  });

  it('reports a type file outside the workspace root as not found', async () => {
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: {
        type: '../../../../x.ts#AppContent',
        emitters: [{ use: 'json-schema-2020-12' }],
      },
    });

    await expect(
      runner.runSchematic('schema', { project: 'test-app' }, tree),
    ).rejects.toThrow('Type file not found: ../../../../x.ts');
  });

  it('names an --output above the workspace root', async () => {
    addCoreStub(tree);
    tree.create(
      app('content.ts'),
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export type AppContent = TextControl;
`,
    );
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: {
        type: 'app/content.ts#AppContent',
        emitters: [{ use: 'json-schema-2020-12' }],
      },
    });

    await expect(
      runner.runSchematic(
        'schema',
        { project: 'test-app', output: '../../../../form.schema.json' },
        tree,
      ),
    ).rejects.toThrow(
      '"output" points outside the workspace root: ../../../../form.schema.json',
    );
  });

  it('names an emitter path above the workspace root', async () => {
    addCoreStub(tree);
    tree.create(
      app('content.ts'),
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export type AppContent = TextControl;
`,
    );
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: {
        type: 'app/content.ts#AppContent',
        emitters: [{ use: '../../../../emitter.ts' }],
      },
    });

    await expect(
      runner.runSchematic('schema', { project: 'test-app' }, tree),
    ).rejects.toThrow(
      '"use" points outside the workspace root: ../../../../emitter.ts',
    );
  });

  it.each([
    ['an empty emitter list', { emitters: [] }],
    ['no emitter list', {}],
  ])('writes nothing for %s', async (_, emitters) => {
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: { type: 'app/types/content.type.ts#AppContent', ...emitters },
    });

    const messages: string[] = [];
    runner.logger.subscribe((entry) => messages.push(entry.message));

    const result = await runner.runSchematic(
      'schema',
      { project: 'test-app' },
      tree,
    );

    expect(result.exists('/projects/test-app/src/form.schema.json')).toBe(
      false,
    );
    expect(messages).toContain(
      'No emitters configured in "schema.emitters". Nothing was written.',
    );
  });

  it('fails naming the requested and configured emitters when --emitter matches none', async () => {
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
        { project: 'test-app', emitter: ['yaml', 'markdown'] },
        tree,
      ),
    ).rejects.toThrow(
      '--emitter "yaml", "markdown" matches no configured emitter entry. Configured: "json-schema-2020-12", "json-schema-draft-07".',
    );
  });

  it('fails naming every unmatched --emitter value when another value matches', async () => {
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
        {
          project: 'test-app',
          emitter: ['json-schema-2020-12', 'json-schema-draft7', 'yaml'],
        },
        tree,
      ),
    ).rejects.toThrow(
      '--emitter "json-schema-draft7", "yaml" matches no configured emitter entry. Configured: "json-schema-2020-12", "json-schema-draft-07".',
    );
  });

  it('fails naming no configured emitters when --emitter is set and none are configured', async () => {
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: { type: 'app/types/content.type.ts#AppContent', emitters: [] },
    });

    await expect(
      runner.runSchematic(
        'schema',
        { project: 'test-app', emitter: ['yaml'] },
        tree,
      ),
    ).rejects.toThrow(
      '--emitter "yaml" matches no configured emitter entry. Configured: none.',
    );
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

  describe('paths that already start with the source root', () => {
    const SOURCE_ROOT = 'projects/test-app/src';

    beforeEach(() => {
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
          emitters: [{ use: 'json-schema-2020-12' }],
        },
      });
    });

    it.each([`${SOURCE_ROOT}/app/a2.json`, `./${SOURCE_ROOT}/app/a2.json`])(
      'writes --output %s without adding the source root again',
      async (output) => {
        const result = await runner.runSchematic(
          'schema',
          { project: 'test-app', output },
          tree,
        );

        expect(result.exists(app('a2.json'))).toBe(true);
      },
    );

    it.each([
      `${SOURCE_ROOT}/app/types/content.type.ts#AppContent`,
      `./${SOURCE_ROOT}/app/types/content.type.ts#AppContent`,
    ])('finds --type %s without adding the source root again', async (type) => {
      const result = await runner.runSchematic(
        'schema',
        { project: 'test-app', type },
        tree,
      );

      expect(readSchema(result, src('form.schema.json')).$defs).toHaveProperty(
        'TextControl',
      );
    });

    it('still adds the source root to a sibling sharing its name as a prefix', async () => {
      const result = await runner.runSchematic(
        'schema',
        { project: 'test-app', output: `${SOURCE_ROOT}-extra/a.json` },
        tree,
      );

      expect(result.exists(src(`${SOURCE_ROOT}-extra/a.json`))).toBe(true);
    });
  });

  describe('in a project with source root "src"', () => {
    beforeEach(() => {
      addProject(tree, 'root-app', '', 'src');
      addCoreStub(tree);
      tree.create(
        '/src/app/types/content.type.ts',
        `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export type AppContent = TextControl;
`,
      );
      writeJson(tree, '/src/app/formbar-schematic.config.json', {
        schema: {
          type: 'app/types/content.type.ts#AppContent',
          emitters: [{ use: 'json-schema-2020-12' }],
        },
      });
    });

    it.each([
      ['app/form.json', '/src/app/form.json'],
      ['src/app/form.json', '/src/app/form.json'],
      ['/schemas/form.json', '/schemas/form.json'],
    ])('writes --output %s to %s', async (output, expected) => {
      const result = await runner.runSchematic(
        'schema',
        { project: 'root-app', output },
        tree,
      );

      expect(result.exists(expected)).toBe(true);
    });
  });

  describe('in a workspace with several projects', () => {
    const union = `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export type AppContent = TextControl;
`;

    beforeEach(() => {
      addCoreStub(tree);
      addProject(tree, 'other', 'projects/other', 'projects/other/src');
      tree.create(app('types/content.type.ts'), union);
      tree.create('/projects/other/src/app/types/content.type.ts', union);
    });

    it('reads the workspace root config for every project without its own', async () => {
      writeJson(tree, '/formbar-schematic.config.json', {
        schema: {
          type: 'app/types/content.type.ts#AppContent',
          emitters: [
            { use: 'json-schema-2020-12', output: 'form.schema.json' },
          ],
        },
      });

      const first = await runner.runSchematic(
        'schema',
        { project: 'test-app' },
        tree,
      );
      const second = await runner.runSchematic(
        'schema',
        { project: 'other' },
        first,
      );

      expect(second.exists(src('form.schema.json'))).toBe(true);
      expect(second.exists('/projects/other/src/form.schema.json')).toBe(true);
    });

    it("never reads another project's config", async () => {
      writeJson(tree, app('formbar-schematic.config.json'), {
        schema: {
          type: 'app/types/content.type.ts#AppContent',
          emitters: [
            { use: 'json-schema-2020-12', output: 'form.schema.json' },
          ],
        },
      });

      await expect(
        runner.runSchematic('schema', { project: 'other' }, tree),
      ).rejects.toThrow('No content type configured');
    });
  });

  describe('emitter entries sharing an output', () => {
    const OUTPUT = '/projects/test-app/src/form.schema.json';
    const DEFAULT_DRAFT_07_OUTPUT =
      '/projects/test-app/src/form.schema.draft-07.json';
    const MODERN = 'json-schema-2020-12';
    const LEGACY = 'json-schema-draft-07';

    beforeEach(() => {
      addCoreStub(tree);
      tree.create(
        app('types/content.type.ts'),
        `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export type AppContent = TextControl;
`,
      );
    });

    function configure(emitters: { use: string; output?: string }[]) {
      writeJson(tree, app('formbar-schematic.config.json'), {
        schema: { type: 'app/types/content.type.ts#AppContent', emitters },
      });
    }

    it('writes each built-in emitter to its own default output', async () => {
      configure([{ use: MODERN }, { use: LEGACY }]);

      const result = await runner.runSchematic(
        'schema',
        { project: 'test-app' },
        tree,
      );

      expect(readSchema(result, OUTPUT).$schema).toBe(DRAFT_2020_12.id);
      expect(readSchema(result, DEFAULT_DRAFT_07_OUTPUT).$schema).toBe(
        DRAFT_07.id,
      );
    });

    it.each<[string, { use: string; output?: string }[], string]>([
      [
        'the same use without an output',
        [{ use: LEGACY }, { use: LEGACY }],
        `"${LEGACY}", "${LEGACY}" write to the same output (${DEFAULT_DRAFT_07_OUTPUT})`,
      ],
      [
        'the same output',
        [
          { use: MODERN, output: 'a.json' },
          { use: LEGACY, output: 'a.json' },
        ],
        `"${MODERN}", "${LEGACY}" write to the same output (/projects/test-app/src/a.json)`,
      ],
      [
        'one output spelled three ways',
        [
          { use: MODERN, output: 'a.json' },
          { use: LEGACY, output: './a.json' },
          { use: './tools/a.ts', output: '/projects/test-app/src/a.json' },
        ],
        `"${MODERN}", "${LEGACY}", "./tools/a.ts" write to the same output (/projects/test-app/src/a.json)`,
      ],
      [
        "an output equal to another entry's default",
        [{ use: MODERN }, { use: LEGACY, output: OUTPUT }],
        `"${MODERN}", "${LEGACY}" write to the same output (${OUTPUT})`,
      ],
    ])('fails before emitting for %s', async (_, emitters, message) => {
      configure(emitters);

      const failing = runner.runSchematic(
        'schema',
        { project: 'test-app' },
        tree,
      );

      await expect(failing).rejects.toThrow(message);
      await expect(failing).rejects.toThrow(SchematicsException);
    });

    it('leaves the default output of a custom emitter to the emitter', async () => {
      tree.create(
        src('tools/by-language.ts'),
        `import { defineEmitter } from '@ngx-formbar/schematics';
export default defineEmitter({
  name: 'by-language',
  emit(model, ctx) {
    ctx.tree.create(\`/\${ctx.paths.projectRoot}/\${String(ctx.options['language'])}.json\`, '{}');
  },
});
`,
      );
      writeJson(tree, app('formbar-schematic.config.json'), {
        schema: {
          type: 'app/types/content.type.ts#AppContent',
          emitters: [
            { use: './tools/by-language.ts', options: { language: 'de' } },
            { use: './tools/by-language.ts', options: { language: 'en' } },
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

      expect(result.exists(src('de.json'))).toBe(true);
      expect(result.exists(src('en.json'))).toBe(true);
      expect(messages).toContain(
        'Emitted with "by-language" to "(emitter default)"',
      );
    });

    it('fails on the same explicit output of a custom emitter', async () => {
      configure([
        { use: './tools/a.ts', output: 'a.json' },
        { use: './tools/a.ts', output: 'a.json' },
      ]);

      await expect(
        runner.runSchematic('schema', { project: 'test-app' }, tree),
      ).rejects.toThrow(
        '"./tools/a.ts", "./tools/a.ts" write to the same output (/projects/test-app/src/a.json)',
      );
    });

    it('logs the default file a built-in emitter writes', async () => {
      const messages: string[] = [];
      runner.logger.subscribe((entry) => messages.push(entry.message));
      configure([{ use: LEGACY }]);

      await runner.runSchematic('schema', { project: 'test-app' }, tree);

      expect(messages).toContain(
        `Emitted with "${LEGACY}" to "${DEFAULT_DRAFT_07_OUTPUT}"`,
      );
    });

    it('allows the same use with different outputs', async () => {
      configure([
        { use: MODERN, output: 'a.json' },
        { use: MODERN, output: 'b.json' },
      ]);

      const result = await runner.runSchematic(
        'schema',
        { project: 'test-app' },
        tree,
      );

      expect(result.exists(src('a.json'))).toBe(true);
      expect(result.exists(src('b.json'))).toBe(true);
    });

    it('checks only the entries --emitter selects', async () => {
      configure([
        { use: MODERN, output: 'a.json' },
        { use: LEGACY, output: 'a.json' },
      ]);

      const result = await runner.runSchematic(
        'schema',
        { project: 'test-app', emitter: [LEGACY] },
        tree,
      );

      expect(readSchema(result, src('a.json')).$schema).toBe(DRAFT_07.id);
    });

    it('leaves the default output of a custom emitter to that emitter', async () => {
      tree.create(
        src('tools/own-default.ts'),
        `import { defineEmitter } from '@ngx-formbar/schematics';
export default defineEmitter({
  name: 'own-default',
  emit(_, ctx) {
    ctx.tree.create(\`\${ctx.paths.projectRoot}/own-default.json\`, '{}');
  },
});
`,
      );
      configure([{ use: MODERN }, { use: './tools/own-default.ts' }]);

      const result = await runner.runSchematic(
        'schema',
        { project: 'test-app' },
        tree,
      );

      expect(result.exists(OUTPUT)).toBe(true);
      expect(result.exists(src('own-default.json'))).toBe(true);
    });
  });

  it('renders descriptions per entry, by default and unless an entry turns them off', async () => {
    addCoreStub(tree);
    tree.create(
      app('types/content.type.ts'),
      `import { NgxFbControl } from '@ngx-formbar/core';
/** A single-line text input. */
export interface TextControl extends NgxFbControl { type: 'text'; }
export type AppContent = TextControl;
`,
    );
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: {
        type: 'app/types/content.type.ts#AppContent',
        emitters: [
          { use: 'json-schema-2020-12', output: 'form.schema.json' },
          {
            use: 'json-schema-draft-07',
            output: 'form.draft-07.json',
            options: { docs: false },
          },
        ],
      },
    });

    const result = await runner.runSchematic(
      'schema',
      { project: 'test-app' },
      tree,
    );

    const modern = readSchema(
      result,
      '/projects/test-app/src/form.schema.json',
    );
    const legacy = readSchema(
      result,
      '/projects/test-app/src/form.draft-07.json',
    );
    expect(modern.$defs).toMatchObject({
      TextControl: { description: 'A single-line text input.' },
    });
    expect(legacy.definitions?.['TextControl']).not.toHaveProperty(
      'description',
    );
  });

  it.each([
    ['a string', 'false', '"false"'],
    ['null', null, 'null'],
  ])('fails when an entry sets docs to %s', async (_, docs, printed) => {
    addCoreStub(tree);
    tree.create(
      app('types/content.type.ts'),
      `import { NgxFbControl } from '@ngx-formbar/core';
/** A single-line text input. */
export interface TextControl extends NgxFbControl { type: 'text'; }
export type AppContent = TextControl;
`,
    );
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: {
        type: 'app/types/content.type.ts#AppContent',
        emitters: [
          {
            use: 'json-schema-2020-12',
            output: 'form.schema.json',
            options: { docs },
          },
        ],
      },
    });

    await expect(
      runner.runSchematic('schema', { project: 'test-app' }, tree),
    ).rejects.toThrow(
      `"options.docs" of the "json-schema-2020-12" emitter must be a boolean, got ${printed}.`,
    );
  });

  it.each([['nope'], [5], [[]], [true], [null]])(
    'names an entry whose options are %j',
    async (options) => {
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
          emitters: [{ use: 'json-schema-2020-12', options }],
        },
      });

      const failure: unknown = await runner
        .runSchematic('schema', { project: 'test-app' }, tree)
        .then(
          () => null,
          (error: unknown) => error,
        );

      expect(failure).toBeInstanceOf(SchematicsException);
      expect(failure).toHaveProperty(
        'message',
        `"options" of the "json-schema-2020-12" emitter entry must be an object, got ${JSON.stringify(options)}.`,
      );
    },
  );

  it('ignores a leftover schema.docs', async () => {
    addCoreStub(tree);
    tree.create(
      app('types/content.type.ts'),
      `import { NgxFbControl } from '@ngx-formbar/core';
/** A single-line text input. */
export interface TextControl extends NgxFbControl { type: 'text'; }
export type AppContent = TextControl;
`,
    );
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: {
        type: 'app/types/content.type.ts#AppContent',
        docs: 'yes',
        emitters: [{ use: 'json-schema-2020-12', output: 'form.schema.json' }],
      },
    });

    const result = await runner.runSchematic(
      'schema',
      { project: 'test-app' },
      tree,
    );

    expect(
      readSchema(result, '/projects/test-app/src/form.schema.json').$defs,
    ).toMatchObject({
      TextControl: { description: 'A single-line text input.' },
    });
  });

  it.each([
    ['no options', undefined, {}],
    ['options.docs: false', { docs: false }, { docs: false }],
  ])(
    'gives a custom emitter the doc and the entry options with %s',
    async (_, options, received) => {
      addCoreStub(tree);
      tree.create(
        app('types/content.type.ts'),
        `import { NgxFbControl } from '@ngx-formbar/core';
/** A single-line text input. */
export interface TextControl extends NgxFbControl { type: 'text'; }
export type AppContent = TextControl;
`,
      );
      tree.create(
        src('tools/probe-emitter.ts'),
        `import { defineEmitter } from '@ngx-formbar/schematics';
export default defineEmitter({
  name: 'probe',
  emit(model, ctx) {
    ctx.tree.create(ctx.paths.output, JSON.stringify({
      doc: model.nodes['TextControl'].doc,
      options: ctx.options,
    }));
  },
});
`,
      );
      writeJson(tree, app('formbar-schematic.config.json'), {
        schema: {
          type: 'app/types/content.type.ts#AppContent',
          emitters: [
            {
              use: './tools/probe-emitter.ts',
              output: 'probe.json',
              options,
            },
          ],
        },
      });

      const result = await runner.runSchematic(
        'schema',
        { project: 'test-app' },
        tree,
      );

      expect(JSON.parse(read(result, src('probe.json')))).toEqual({
        doc: 'A single-line text input.',
        options: received,
      });
    },
  );

  it('names the core it resolved', async () => {
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
        emitters: [{ use: 'json-schema-2020-12', output: 'form.schema.json' }],
      },
    });

    const messages: string[] = [];
    runner.logger.subscribe((entry) => messages.push(entry.message));

    await runner.runSchematic('schema', { project: 'test-app' }, tree);

    // Which copy answered is otherwise invisible, and it decides every kind.
    expect(messages).toContainEqual(
      expect.stringMatching(
        /^Resolved @ngx-formbar\/core at ".*\/node_modules\/@ngx-formbar\/core\/"$/,
      ),
    );
  });

  it("resolves a library project's content union through a root path alias", async () => {
    tree = await runner.runExternalSchematic(
      '@schematics/angular',
      'library',
      { name: 'lib' },
      tree,
    );
    addCoreStub(tree);
    tree.overwrite(
      '/tsconfig.json',
      JSON.stringify({
        compilerOptions: { paths: { '@shared/*': ['./shared/*'] } },
      }),
    );
    tree.create(
      '/shared/text.ts',
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
`,
    );
    tree.create(
      '/projects/lib/src/content.ts',
      `import { TextControl } from '@shared/text';
export type AppContent = TextControl;
`,
    );
    writeJson(tree, '/projects/lib/src/app/formbar-schematic.config.json', {
      schema: {
        type: 'content.ts#AppContent',
        emitters: [{ use: 'json-schema-2020-12', output: 'form.schema.json' }],
      },
    });

    const result = await runner.runSchematic(
      'schema',
      { project: 'lib' },
      tree,
    );

    expect(
      readSchema(result, '/projects/lib/src/form.schema.json').$defs,
    ).toHaveProperty('TextControl');
  });

  it("reads a library's alias from its tsconfig.lib.json", async () => {
    await runner.runExternalSchematic(
      '@schematics/angular',
      'library',
      { name: 'lib' },
      tree,
    );
    addCoreStub(tree);
    tree.overwrite(
      '/projects/lib/tsconfig.lib.json',
      JSON.stringify({
        compilerOptions: { paths: { '@shared/*': ['../../shared/*'] } },
      }),
    );
    writeAliasedUnion('/projects/lib/src');

    const result = await runner.runSchematic(
      'schema',
      { project: 'lib' },
      tree,
    );

    expect(
      readSchema(result, '/projects/lib/src/form.schema.json').$defs,
    ).toHaveProperty('TextControl');
  });

  it.each([
    [
      "the project root's tsconfig.json",
      '/apps/forms/tsconfig.json',
      '../../shared/*',
    ],
    [
      "the workspace's tsconfig.base.json when it has no tsconfig.json",
      '/tsconfig.base.json',
      './shared/*',
    ],
  ])('reads an alias from %s', async (_, tsConfigPath, target) => {
    addProject(tree, 'forms', 'apps/forms', 'apps/forms/src');
    addCoreStub(tree);
    tree.delete('/tsconfig.json');
    tree.create(
      tsConfigPath,
      JSON.stringify({ compilerOptions: { paths: { '@shared/*': [target] } } }),
    );
    writeAliasedUnion('/apps/forms/src');

    const result = await runner.runSchematic(
      'schema',
      { project: 'forms' },
      tree,
    );

    expect(
      readSchema(result, '/apps/forms/src/form.schema.json').$defs,
    ).toHaveProperty('TextControl');
  });

  it("prefers the workspace's tsconfig.json over its tsconfig.base.json", async () => {
    addProject(tree, 'forms', 'apps/forms', 'apps/forms/src');
    addCoreStub(tree);
    tree.overwrite(
      '/tsconfig.json',
      JSON.stringify({
        compilerOptions: { paths: { '@shared/*': ['./shared/*'] } },
      }),
    );
    tree.create(
      '/tsconfig.base.json',
      JSON.stringify({
        compilerOptions: { paths: { '@shared/*': ['./elsewhere/*'] } },
      }),
    );
    writeAliasedUnion('/apps/forms/src');

    const result = await runner.runSchematic(
      'schema',
      { project: 'forms' },
      tree,
    );

    expect(
      readSchema(result, '/apps/forms/src/form.schema.json').$defs,
    ).toHaveProperty('TextControl');
  });

  it("reads the tsconfig named by the project's build target", async () => {
    addCoreStub(tree);
    tree.overwrite(
      '/angular.json',
      tree
        .readContent('/angular.json')
        .replace(
          '"tsConfig": "projects/test-app/tsconfig.app.json"',
          '"tsConfig": "projects/test-app/tsconfig.build.json"',
        ),
    );
    tree.create(
      appRoot('tsconfig.build.json'),
      JSON.stringify({
        compilerOptions: { paths: { '@shared/*': ['./src/shared/*'] } },
      }),
    );
    tree.create(
      src('shared/text.ts'),
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
`,
    );
    tree.create(
      app('types/content.type.ts'),
      `import { TextControl } from '@shared/text';
export type AppContent = TextControl;
`,
    );
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: {
        type: 'app/types/content.type.ts#AppContent',
        emitters: [{ use: 'json-schema-2020-12', output: 'form.schema.json' }],
      },
    });

    const result = await runner.runSchematic(
      'schema',
      { project: 'test-app' },
      tree,
    );

    expect(
      readSchema(result, '/projects/test-app/src/form.schema.json').$defs,
    ).toHaveProperty('TextControl');
  });

  it('reads the automation config named by --schematicsConfig', async () => {
    addCoreStub(tree);
    tree.create(
      app('types/content.type.ts'),
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export type AppContent = TextControl;
`,
    );
    // Deliberately not the discoverable name, so only the option can find it.
    writeJson(tree, app('custom-schema.config.json'), {
      schema: {
        type: 'app/types/content.type.ts#AppContent',
        emitters: [{ use: 'json-schema-2020-12', output: 'form.schema.json' }],
      },
    });

    const result = await runner.runSchematic(
      'schema',
      {
        project: 'test-app',
        schematicsConfig: 'app/custom-schema.config.json',
      },
      tree,
    );

    expect(result.exists('/projects/test-app/src/form.schema.json')).toBe(true);
  });

  it('resolves a "./"-prefixed output the same way a "./"-prefixed emitter is resolved', async () => {
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
          { use: 'json-schema-2020-12', output: './form.schema.json' },
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
    // The path handed to the emitter and logged back is the canonical one, not
    // one carrying the config's "./" through.
    expect(messages).toContain(
      'Emitted with "json-schema-2020-12" to "/projects/test-app/src/form.schema.json"',
    );
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

  it('applies --output to the emitter selected by --emitter', async () => {
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
      {
        project: 'test-app',
        emitter: ['json-schema-2020-12'],
        output: 'custom.json',
      },
      tree,
    );

    expect(result.exists('/projects/test-app/src/custom.json')).toBe(true);
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
  caption: string;
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
    expect(
      messages.some((message) => message.includes('CallbackControl.caption')),
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

  it('hands emitters the workspace root when run from a subdirectory', async () => {
    const workspaceRoot = mkdtempSync(join(tmpdir(), 'ngx-formbar-schema-'));
    tempRoots.push(workspaceRoot);
    const subdirectory = join(workspaceRoot, 'projects/test-app/src');
    mkdirSync(subdirectory, { recursive: true });
    writeFileSync(join(workspaceRoot, 'angular.json'), '{}');
    vi.spyOn(process, 'cwd').mockReturnValue(subdirectory);

    addCoreStub(tree);
    tree.create(
      app('types/content.type.ts'),
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export type AppContent = TextControl;
`,
    );
    tree.create(
      src('tools/root-emitter.ts'),
      `import { defineEmitter } from '@ngx-formbar/schematics';

export default defineEmitter({
  name: 'root',
  emit(model, ctx) {
    ctx.tree.create('/root.txt', ctx.paths.workspaceRoot);
  },
});
`,
    );
    writeJson(tree, app('formbar-schematic.config.json'), {
      schema: {
        type: 'app/types/content.type.ts#AppContent',
        emitters: [{ use: './tools/root-emitter.ts' }],
      },
    });

    const result = await runner.runSchematic(
      'schema',
      { project: 'test-app' },
      tree,
    );

    expect(read(result, '/root.txt')).toBe(workspaceRoot);
  });
});
