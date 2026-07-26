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

function peerContent(union: string) {
  return `import { NgxFbControl, NgxFbBlock } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; peer: NoteBlock; }
export interface NoteBlock extends NgxFbBlock { type: 'note'; message: string; }
export type AppContent = ${union};
`;
}

function peerType(model: FormModel) {
  return model.nodes['TextControl'].properties.find(
    (property) => property.name === 'peer',
  )?.type;
}

describe('buildModel', () => {
  describe('a union of every node kind', () => {
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

    it('carries doc comments when enabled', () => {
      const hint = model.nodes['TextControl'].properties.find(
        (property) => property.name === 'hint',
      );

      expect(hint?.doc).toBe('Shown under the input.');
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

  it('omits doc comments when disabled', async () => {
    const withoutDocs = await modelFor(CONTENT, false);
    const hint = withoutDocs.nodes['TextControl'].properties.find(
      (property) => property.name === 'hint',
    );

    expect(hint?.doc).toBeUndefined();
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

  it('references a peer union member instead of inlining it', async () => {
    const peers = await modelFor(peerContent('NoteBlock | TextControl'));

    expect(peerType(peers)).toEqual({ k: 'ref', node: 'NoteBlock' });
  });

  it('references a peer union member regardless of member order', async () => {
    const peers = await modelFor(peerContent('TextControl | NoteBlock'));

    expect(peerType(peers)).toEqual({ k: 'ref', node: 'NoteBlock' });
  });

  it('marks a self-referential property type as a cycle', async () => {
    const recursive = await modelFor(
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface OptionNode { label: string; children?: OptionNode[]; }
export interface SelectControl extends NgxFbControl { type: 'select'; tree: OptionNode; }
export type AppContent = SelectControl;
`,
    );
    const tree = recursive.nodes['SelectControl'].properties.find(
      (property) => property.name === 'tree',
    );

    expect(tree?.type).toEqual({
      k: 'object',
      name: 'OptionNode',
      properties: [
        { name: 'label', optional: false, type: { k: 'string' } },
        {
          name: 'children',
          optional: true,
          type: {
            k: 'union',
            members: [
              { k: 'array', items: { k: 'cycle', name: 'OptionNode' } },
            ],
          },
        },
      ],
    });
  });

  it('captures the value type of an index signature on a nested object', async () => {
    const meta = await modelFor(
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface MetaControl extends NgxFbControl { type: 'meta'; meta: { [key: string]: number }; }
export type AppContent = MetaControl;
`,
    );
    const property = meta.nodes['MetaControl'].properties.find(
      (candidate) => candidate.name === 'meta',
    );

    expect(property?.type).toEqual({
      k: 'object',
      properties: [],
      index: { k: 'number' },
    });
  });

  it('rejects a union member that extends no core base type', async () => {
    await expect(
      modelFor(
        `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export interface Rogue { type: 'rogue'; }
export type AppContent = TextControl | Rogue;
`,
      ),
    ).rejects.toThrow('Rogue does not extend a @ngx-formbar/core base type.');
  });
});
