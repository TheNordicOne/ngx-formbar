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
import { app } from './helper';
import { resolveContentType } from '../schema/resolve';
import { SchemaContext } from '../schema/schema';

function context(overrides: Partial<SchemaContext> = {}): SchemaContext {
  return {
    typeReference: 'app/types/content.type.ts#AppContent',
    docs: true,
    entries: [],
    projectRoot: 'projects/test-app/src',
    workspaceRoot: '/',
    tsConfigPath: 'projects/test-app/tsconfig.app.json',
    ...overrides,
  };
}

describe('resolveContentType', () => {
  let tree: UnitTestTree;

  beforeEach(async () => {
    tree = await setupWorkspace(
      new SchematicTestRunner('schematics', COLLECTION_PATH),
    );
    addCoreStub(tree);
    tree.create(
      app('types/content.type.ts'),
      `import { NgxFbControl, NgxFbBlock } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export interface NoteBlock extends NgxFbBlock { type: 'note'; }
export type AppContent = TextControl | NoteBlock;
`,
    );
  });

  it('resolves the referenced export to a union type', () => {
    const { type, checker, coreRoot } = resolveContentType(tree, context());

    expect(type.isUnion()).toBe(true);
    if (!type.isUnion()) {
      throw new Error('expected a union type');
    }

    const names = type.types.map((member) => checker.typeToString(member));
    expect(names).toEqual(['TextControl', 'NoteBlock']);
    expect(coreRoot).toBe('/node_modules/@ngx-formbar/core/');
  });

  it('throws when the export does not exist', () => {
    expect(() =>
      resolveContentType(
        tree,
        context({ typeReference: 'app/types/content.type.ts#Missing' }),
      ),
    ).toThrow(/Missing/);
  });
});
