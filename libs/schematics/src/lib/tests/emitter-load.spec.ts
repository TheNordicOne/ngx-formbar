import { beforeEach, describe, expect, it } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { logging } from '@angular-devkit/core';
import { COLLECTION_PATH, setupWorkspace } from './workspace-setup';
import { resolveEmitter } from '../schema/emitter/registry';
import { FormModel } from '../schema/model';

const PATHS = {
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

  beforeEach(async () => {
    tree = await setupWorkspace(
      new SchematicTestRunner('schematics', COLLECTION_PATH),
    );
  });

  it('loads a TypeScript emitter from a project-relative path', () => {
    tree.create(
      '/projects/test-app/src/tools/yaml-emitter.ts',
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

    await resolveEmitter('./tools/split-emitter.ts', tree, PATHS).emit(MODEL, {
      tree,
      options: { docs: true },
      logger: new logging.NullLogger(),
      paths: PATHS,
    });

    expect(tree.readContent('/out.txt')).toBe('text,group');
  });

  it('throws for an unknown specifier', () => {
    expect(() => resolveEmitter('nope', tree, PATHS)).toThrow(/nope/);
  });
});

function createSplitEmitter(tree: UnitTestTree): void {
  tree.create(
    '/projects/test-app/src/tools/render.ts',
    `export function render(model: { nodes: Record<string, unknown> }) {
  return Object.keys(model.nodes).join(',');
}
`,
  );
  tree.create(
    '/projects/test-app/src/tools/split-emitter.ts',
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
