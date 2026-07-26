import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { logging } from '@angular-devkit/core';
import { SchematicsException } from '@angular-devkit/schematics';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { COLLECTION_PATH, setupWorkspace } from './workspace-setup';
import { src } from './helper';
import { resolveEmitter } from '../schema/emitter/registry';
import { EmitContext, EmitPaths } from '../schema/emitter/define-emitter';
import { FormModel } from '../schema/model';

const PATHS: EmitPaths = {
  workspaceRoot: '/',
  projectRoot: 'projects/test-app/src',
  output: null,
};

const MODEL: FormModel = {
  root: { name: 'NgxFbItem', members: ['text', 'group'] },
  nodes: {
    text: {
      name: 'text',
      kind: 'control',
      typeLiteral: 'text',
      open: false,
      properties: [],
    },
    group: {
      name: 'group',
      kind: 'group',
      typeLiteral: 'group',
      open: false,
      properties: [],
    },
  },
};

describe('resolveEmitter', () => {
  let tree: UnitTestTree;
  const tempRoots: string[] = [];

  beforeEach(async () => {
    tree = await setupWorkspace(
      new SchematicTestRunner('schematics', COLLECTION_PATH),
    );
  });

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  function tempWorkspaceRoot(): string {
    const root = mkdtempSync(join(tmpdir(), 'ngx-formbar-emitter-'));
    tempRoots.push(root);
    return root;
  }

  it('loads a TypeScript emitter from a project-relative path', () => {
    tree.create(
      src('tools/yaml-emitter.ts'),
      `import { defineEmitter } from '@ngx-formbar/schematics';

export default defineEmitter({
  name: 'yaml',
  emit(model, ctx) {
    ctx.tree.create('out.txt', Object.keys(model.nodes).join(','));
  },
});
`,
    );

    expect(resolveEmitter('./tools/yaml-emitter.ts', tree, PATHS).name).toBe(
      'yaml',
    );
  });

  it('loads an emitter that imports a sibling file', () => {
    createSplitEmitter(tree);

    expect(resolveEmitter('./tools/split-emitter.ts', tree, PATHS).name).toBe(
      'split',
    );
  });

  it('runs a two-file emitter against the model', async () => {
    createSplitEmitter(tree);

    await resolveEmitter('./tools/split-emitter.ts', tree, PATHS).emit(
      MODEL,
      emitContext(tree, PATHS),
    );

    expect(tree.readContent('/out.txt')).toBe('text,group');
  });

  it('throws for an unknown specifier', () => {
    expect(() => resolveEmitter('nope', tree, PATHS)).toThrow(/nope/);
  });

  it('throws when the emitter file does not exist', () => {
    expect(() => resolveEmitter('./tools/absent.ts', tree, PATHS)).toThrow(
      `Emitter file not found: ${src('tools/absent.ts')}`,
    );
  });

  it('throws when the module does not export a defineEmitter result', () => {
    tree.create(
      src('tools/plain.ts'),
      `export default { name: 'plain', render() {} };
`,
    );

    expect(() => resolveEmitter('./tools/plain.ts', tree, PATHS)).toThrow(
      `"${src('tools/plain.ts')}" does not export an emitter created with defineEmitter().`,
    );
  });

  it('reports a compile error against the emitter file', () => {
    tree.create(
      src('tools/broken.ts'),
      `import { defineEmitter } from '@ngx-formbar/schematics';

export default defineEmitter({ name: 'broken',
`,
    );

    expect(() => resolveEmitter('./tools/broken.ts', tree, PATHS)).toThrow(
      SchematicsException,
    );
    expect(() => resolveEmitter('./tools/broken.ts', tree, PATHS)).toThrow(
      `Emitter ${src('tools/broken.ts')} failed to compile: '}' expected.`,
    );
  });

  it('throws when an emitter imports an export that is not served', () => {
    tree.create(
      src('tools/unserved.ts'),
      `import { defineEmitter, register } from '@ngx-formbar/schematics';

export const borrowed = register;

export default defineEmitter({ name: 'unserved', emit() {} });
`,
    );

    expect(() => resolveEmitter('./tools/unserved.ts', tree, PATHS)).toThrow(
      /register/,
    );
  });

  it('serves the package to an emitter that default-imports it', () => {
    tree.create(
      src('tools/default-import-emitter.ts'),
      `import formbar from '@ngx-formbar/schematics';

export default formbar.defineEmitter({ name: 'default-import', emit() {} });
`,
    );

    expect(
      resolveEmitter('./tools/default-import-emitter.ts', tree, PATHS).name,
    ).toBe('default-import');
  });

  it('serves the package to an emitter that namespace-imports it', () => {
    tree.create(
      src('tools/namespace-import-emitter.ts'),
      `import * as formbar from '@ngx-formbar/schematics';

export default formbar.defineEmitter({
  name: 'namespace-import',
  emit() {},
});
`,
    );

    expect(
      resolveEmitter('./tools/namespace-import-emitter.ts', tree, PATHS).name,
    ).toBe('namespace-import');
  });

  it('serves the package under a direct `default` access', () => {
    tree.create(
      src('tools/direct-default.js'),
      `const formbar = require('@ngx-formbar/schematics');

module.exports = formbar.default.defineEmitter({
  name: 'direct-default',
  emit() {},
});
`,
    );

    expect(resolveEmitter('./tools/direct-default.js', tree, PATHS).name).toBe(
      'direct-default',
    );
  });

  it('serves the package to an emitter that reaches it via a dynamic import', async () => {
    tree.create(
      src('tools/dynamic-import-emitter.ts'),
      `export default {
  name: 'dynamic-import',
  async emit(model, ctx) {
    const { defineEmitter } = await import('@ngx-formbar/schematics');
    ctx.tree.create('out.txt', typeof defineEmitter);
  },
};
`,
    );

    await resolveEmitter('./tools/dynamic-import-emitter.ts', tree, PATHS).emit(
      MODEL,
      emitContext(tree, PATHS),
    );

    expect(tree.readContent('/out.txt')).toBe('function');
  });

  it('serves toJsonTypes to an emitter', async () => {
    tree.create(
      src('tools/projecting-emitter.ts'),
      `import { defineEmitter, toJsonTypes } from '@ngx-formbar/schematics';

export default defineEmitter({
  name: 'projecting',
  emit(model, ctx) {
    const projected = toJsonTypes({
      k: 'union',
      members: [{ k: 'string' }, { k: 'function' }],
    });
    ctx.tree.create('projected.json', JSON.stringify(projected));
  },
});
`,
    );

    await resolveEmitter('./tools/projecting-emitter.ts', tree, PATHS).emit(
      MODEL,
      emitContext(tree, PATHS),
    );

    expect(JSON.parse(tree.readContent('/projected.json'))).toEqual({
      k: 'string',
    });
  });

  it('honours esModuleInterop when an emitter default-imports a CommonJS sibling', async () => {
    tree.create(
      src('tools/legacy-render.js'),
      `module.exports = function render(model) {
  return Object.keys(model.nodes).join('|');
};
`,
    );
    tree.create(
      src('tools/interop-emitter.ts'),
      `import { defineEmitter } from '@ngx-formbar/schematics';
import render from './legacy-render.js';

export default defineEmitter({
  name: 'interop',
  emit(model, ctx) {
    ctx.tree.create('out.txt', render(model));
  },
});
`,
    );

    await resolveEmitter('./tools/interop-emitter.ts', tree, PATHS).emit(
      MODEL,
      emitContext(tree, PATHS),
    );

    expect(tree.readContent('/out.txt')).toBe('text|group');
  });

  it('evaluates a module shared by two emitter files exactly once', async () => {
    tree.create(
      src('tools/state.ts'),
      `export const state = { visits: 0 };
`,
    );
    tree.create(
      src('tools/visitor.ts'),
      `import { state } from './state';

state.visits += 1;
`,
    );
    tree.create(
      src('tools/shared-emitter.ts'),
      `import { defineEmitter } from '@ngx-formbar/schematics';
import { state } from './state';
import './visitor';

export default defineEmitter({
  name: 'shared',
  emit(model, ctx) {
    ctx.tree.create('visits.txt', String(state.visits));
  },
});
`,
    );

    await resolveEmitter('./tools/shared-emitter.ts', tree, PATHS).emit(
      MODEL,
      emitContext(tree, PATHS),
    );

    expect(tree.readContent('/visits.txt')).toBe('1');
  });

  it('loads an emitter whose files import each other', async () => {
    tree.create(
      src('tools/cycle-b.ts'),
      `import { prefix } from './cycle-a';

export function suffix() {
  return '-' + prefix;
}
`,
    );
    tree.create(
      src('tools/cycle-a.ts'),
      `import { defineEmitter } from '@ngx-formbar/schematics';
import { suffix } from './cycle-b';

export const prefix = 'cy';

export default defineEmitter({
  name: 'cyclic',
  emit(model, ctx) {
    ctx.tree.create('cycle.txt', prefix + suffix());
  },
});
`,
    );

    await resolveEmitter('./tools/cycle-a.ts', tree, PATHS).emit(
      MODEL,
      emitContext(tree, PATHS),
    );

    expect(tree.readContent('/cycle.txt')).toBe('cy-cy');
  });

  it('resolves a bare specifier from the emitter project own node_modules', () => {
    const workspaceRoot = tempWorkspaceRoot();
    writePackage(
      join(workspaceRoot, 'projects/test-app/src/tools/node_modules/local-dep'),
      'local-dep',
      `exports.label = 'from-project';
`,
    );
    tree.create(
      src('tools/dependent-emitter.ts'),
      `import { defineEmitter } from '@ngx-formbar/schematics';
import { label } from 'local-dep';

export default defineEmitter({ name: label, emit() {} });
`,
    );

    expect(
      resolveEmitter('./tools/dependent-emitter.ts', tree, {
        ...PATHS,
        workspaceRoot,
      }).name,
    ).toBe('from-project');
  });

  it('loads the named export of a package emitter', () => {
    const workspaceRoot = tempWorkspaceRoot();
    writePackage(
      join(workspaceRoot, 'node_modules/emitter-pack'),
      'emitter-pack',
      `exports.custom = { name: 'packaged', emit() {} };
`,
    );

    expect(
      resolveEmitter('emitter-pack#custom', tree, { ...PATHS, workspaceRoot })
        .name,
    ).toBe('packaged');
  });
});

function emitContext(tree: UnitTestTree, paths: EmitPaths): EmitContext {
  return {
    tree,
    options: { docs: true },
    logger: new logging.NullLogger(),
    paths,
  };
}

function writePackage(directory: string, name: string, entry: string): void {
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    join(directory, 'package.json'),
    JSON.stringify({ name, version: '1.0.0', main: 'index.js' }),
  );
  writeFileSync(join(directory, 'index.js'), entry);
}

function createSplitEmitter(tree: UnitTestTree): void {
  tree.create(
    src('tools/render.ts'),
    `export function render(model: { nodes: Record<string, unknown> }) {
  return Object.keys(model.nodes).join(',');
}
`,
  );
  tree.create(
    src('tools/split-emitter.ts'),
    `import { defineEmitter } from '@ngx-formbar/schematics';
import { render } from './render';

export default defineEmitter({
  name: 'split',
  emit(model, ctx) {
    ctx.tree.create('out.txt', render(model));
  },
});
`,
  );
}
