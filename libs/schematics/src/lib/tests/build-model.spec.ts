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
import { buildModel } from '../schema/build-model';
import { FormModel } from '../schema/model';

const CONTENT = `import { NgxFbControl, NgxFbFormGroup, NgxFbArray, NgxFbBlock, NgxFbBaseContent, NgxFbItem } from '@ngx-formbar/core';

export interface TextControl extends NgxFbControl {
  type: 'text';
  /** Shown under the input. */
  hint?: string;
  options: { id: string; label: string }[];
}
export interface NoteBlock extends NgxFbBlock { type: 'note'; message: string; }
export interface GroupControl<T extends NgxFbBaseContent = NgxFbItem> extends NgxFbFormGroup<T> { type: 'group'; }
export interface RowArray<T extends NgxFbBaseContent = NgxFbItem> extends NgxFbArray<T> { type: 'array'; }
export type AppContent = TextControl | NoteBlock | GroupControl<AppContent> | RowArray<AppContent>;
`;

async function modelFor(source: string, docs = true): Promise<FormModel> {
  const tree: UnitTestTree = await setupWorkspace(
    new SchematicTestRunner('schematics', COLLECTION_PATH),
  );
  addCoreStub(tree);
  tree.create(app('types/content.type.ts'), source);

  const { type, checker, coreRoot } = resolveContentType(tree, {
    typeReference: 'app/types/content.type.ts#AppContent',
    docs,
    entries: [],
    projectRoot: 'projects/test-app/src',
    workspaceRoot: '/',
    tsConfigPath: 'projects/test-app/tsconfig.app.json',
  });

  return buildModel(type, checker, coreRoot, docs);
}

describe('buildModel', () => {
  let model: FormModel;

  beforeEach(async () => {
    model = await modelFor(CONTENT);
  });

  it('lists every union member as a root reference', () => {
    expect(model.root.members).toEqual([
      'TextControl',
      'NoteBlock',
      'GroupControl',
      'RowArray',
    ]);
  });

  it('assigns the kind from the core base each member extends', () => {
    expect(model.nodes['TextControl'].kind).toBe('control');
    expect(model.nodes['NoteBlock'].kind).toBe('block');
    expect(model.nodes['GroupControl'].kind).toBe('group');
    expect(model.nodes['RowArray'].kind).toBe('array');
  });

  it('reads the narrowed type literal', () => {
    expect(model.nodes['TextControl'].typeLiteral).toBe('text');
  });

  it('marks a node with an index signature as open', () => {
    expect(model.nodes['NoteBlock'].open).toBe(true);
    expect(model.nodes['TextControl'].open).toBe(false);
  });

  it('normalises property types', () => {
    const options = model.nodes['TextControl'].properties.find(
      (property) => property.name === 'options',
    );

    expect(options).toEqual({
      name: 'options',
      optional: false,
      type: {
        k: 'array',
        items: {
          k: 'object',
          properties: [
            { name: 'id', optional: false, type: { k: 'string' } },
            { name: 'label', optional: false, type: { k: 'string' } },
          ],
        },
      },
    });
  });

  it('keeps the function arm of Expression', () => {
    const hidden = model.nodes['TextControl'].properties.find(
      (property) => property.name === 'hidden',
    );

    expect(hidden?.type).toEqual({
      k: 'union',
      members: [{ k: 'string' }, { k: 'boolean' }, { k: 'function' }],
    });
  });

  it('represents a plain boolean property as a boolean node', async () => {
    const toggle = await modelFor(
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface ToggleControl extends NgxFbControl { type: 'toggle'; required: boolean; }
export type AppContent = ToggleControl;
`,
    );
    const required = toggle.nodes['ToggleControl'].properties.find(
      (property) => property.name === 'required',
    );

    expect(required?.type).toEqual({ k: 'boolean' });
  });

  it('carries doc comments when enabled', () => {
    const hint = model.nodes['TextControl'].properties.find(
      (property) => property.name === 'hint',
    );

    expect(hint?.doc).toBe('Shown under the input.');
  });

  it('omits doc comments when disabled', async () => {
    const withoutDocs = await modelFor(CONTENT, false);
    const hint = withoutDocs.nodes['TextControl'].properties.find(
      (property) => property.name === 'hint',
    );

    expect(hint?.doc).toBeUndefined();
  });

  it('represents nesting as a reference back to the union', () => {
    expect(model.nodes['GroupControl'].children?.members).toEqual([
      'TextControl',
      'NoteBlock',
      'GroupControl',
      'RowArray',
    ]);
    expect(model.nodes['RowArray'].children?.members).toEqual(
      model.root.members,
    );
  });

  it('excludes structural and discriminant properties', () => {
    const names = model.nodes['GroupControl'].properties.map((p) => p.name);

    expect(names).not.toContain('controls');
    expect(names).not.toContain('type');
  });

  it('leaves typeLiteral null when type is not narrowed', async () => {
    const loose = await modelFor(
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface LooseControl extends NgxFbControl { label?: string; }
export type AppContent = LooseControl;
`,
    );

    expect(loose.nodes['LooseControl'].typeLiteral).toBeNull();
  });
});
