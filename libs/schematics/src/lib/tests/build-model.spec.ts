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
import Ajv2020 from 'ajv/dist/2020';
import {
  buildJsonSchema,
  DRAFT_2020_12,
} from '../schema/emitter/json-schema/build';

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

async function modelFor(source: string): Promise<FormModel> {
  const tree: UnitTestTree = await setupWorkspace(
    new SchematicTestRunner('schematics', COLLECTION_PATH),
  );
  addCoreStub(tree);
  tree.create(app('types/content.type.ts'), source);

  const { type, checker, coreRoot } = resolveContentType(tree, {
    typeReference: 'app/types/content.type.ts#AppContent',
    entries: [],
    projectRoot: 'projects/test-app/src',
    workspaceRoot: '/',
    tsConfigPath: 'projects/test-app/tsconfig.app.json',
  });

  return buildModel(type, checker, coreRoot);
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
      expect(model.nodes['TextControl'].typeLiteral).toEqual(['text']);
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

    it('always carries doc comments', () => {
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

    it('resolves an array row through the narrowing core applies to it', () => {
      // `NgxFbArray` types its row as `T & { hideStrategy?: 'keep' }`, so every
      // member of the row union arrives as an intersection with no declaration
      // of its own.
      expect(model.nodes['RowArray'].children?.members).toEqual(
        model.root.members,
      );
      expect(Object.keys(model.nodes)).toEqual(model.root.members);
    });

    it("carries core's row narrowing on the array's children reference", () => {
      expect(model.nodes['RowArray'].children?.constraints).toEqual([
        {
          name: 'hideStrategy',
          optional: true,
          type: { k: 'union', members: [{ k: 'literal', value: 'keep' }] },
        },
      ]);
      expect(
        model.nodes['RowArray'].children?.memberConstraints,
      ).toBeUndefined();
    });

    it('omits constraints from a union no intersection narrows', () => {
      expect(model.root.constraints).toBeUndefined();
      expect(model.nodes['GroupControl'].children?.constraints).toBeUndefined();
    });

    it('excludes structural and discriminant properties', () => {
      const names = model.nodes['GroupControl'].properties.map((p) => p.name);

      expect(names).not.toContain('controls');
      expect(names).not.toContain('type');
    });
  });

  describe('two instantiations of one generic', () => {
    let model: FormModel;

    beforeEach(async () => {
      model = await modelFor(
        `import { NgxFbControl, NgxFbBlock, NgxFbFormGroup, NgxFbBaseContent, NgxFbItem } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export interface NoteBlock extends NgxFbBlock { type: 'note'; }
export interface GroupControl<T extends NgxFbBaseContent = NgxFbItem> extends NgxFbFormGroup<T> { type: 'group'; }
export type Inner = TextControl | NoteBlock;
export type AppContent = TextControl | GroupControl<AppContent> | GroupControl<Inner>;
`,
      );
    });

    it('keeps each instantiation a node of its own', () => {
      expect(model.root.members).toEqual([
        'TextControl',
        'GroupControl<AppContent>',
        'GroupControl<Inner>',
      ]);
      expect(Object.keys(model.nodes).sort()).toEqual([
        'GroupControl<AppContent>',
        'GroupControl<Inner>',
        'NoteBlock',
        'TextControl',
      ]);
    });

    it('gives each instantiation its own children', () => {
      expect(model.nodes['GroupControl<AppContent>'].children?.members).toEqual(
        model.root.members,
      );
      expect(model.nodes['GroupControl<Inner>'].children?.members).toEqual([
        'TextControl',
        'NoteBlock',
      ]);
    });

    it('validates each instantiation against its own children', () => {
      const validate = new Ajv2020({ strict: false }).compile(
        buildJsonSchema(model, DRAFT_2020_12, { docs: true }),
      );

      expect(
        validate({
          content: {
            g: {
              type: 'group',
              controls: { n: { type: 'note', isControl: false } },
            },
          },
        }),
      ).toBe(true);
      expect(
        validate({
          content: {
            g: { type: 'group', controls: { n: { type: 'nope' } } },
          },
        }),
      ).toBe(false);
    });
  });

  describe("a group and an array left on core's default children", () => {
    let model: FormModel;

    beforeEach(async () => {
      model = await modelFor(
        `import { NgxFbControl, NgxFbBlock, NgxFbFormGroup, NgxFbArray } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export interface NoteBlock extends NgxFbBlock { type: 'note'; }
export interface GroupControl extends NgxFbFormGroup { type: 'group'; }
export interface RowArray extends NgxFbArray { type: 'array'; }
export type AppContent = TextControl | NoteBlock | GroupControl | RowArray;
`,
      );
    });

    it('takes every registered member as a child', () => {
      expect(Object.keys(model.nodes)).toEqual(model.root.members);
      expect(model.nodes['GroupControl'].children?.members).toEqual(
        model.root.members,
      );
      expect(model.nodes['RowArray'].children?.members).toEqual(
        model.root.members,
      );
    });

    it("keeps core's row narrowing on the array's children", () => {
      expect(model.nodes['RowArray'].children?.constraints).toEqual([
        {
          name: 'hideStrategy',
          optional: true,
          type: { k: 'union', members: [{ k: 'literal', value: 'keep' }] },
        },
      ]);
    });

    it('validates nested children against the registered members', () => {
      const validate = new Ajv2020({ strict: false }).compile(
        buildJsonSchema(model, DRAFT_2020_12, { docs: true }),
      );

      expect(
        validate({
          content: {
            g: {
              type: 'group',
              controls: {
                t: { type: 'text' },
                rows: { type: 'array', rowControl: { type: 'text' } },
              },
            },
          },
        }),
      ).toBe(true);
      expect(
        validate({
          content: { g: { type: 'group', controls: { t: { type: 'txet' } } } },
        }),
      ).toBe(false);
      expect(
        validate({
          content: {
            rows: {
              type: 'array',
              rowControl: { type: 'text', hideStrategy: 'remove' },
            },
          },
        }),
      ).toBe(false);
    });
  });

  it('takes only the registered members of the kind a core base child names', async () => {
    const model = await modelFor(
      `import { NgxFbControl, NgxFbBlock, NgxFbFormGroup } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export interface NoteBlock extends NgxFbBlock { type: 'note'; }
export interface FieldGroup extends NgxFbFormGroup<NgxFbControl> { type: 'fields'; }
export type AppContent = TextControl | NoteBlock | FieldGroup;
`,
    );

    expect(model.nodes['FieldGroup'].children?.members).toEqual([
      'TextControl',
    ]);
  });

  it('rejects a core base child whose kind the union never registers', async () => {
    await expect(
      modelFor(
        `import { NgxFbControl, NgxFbArray, NgxFbFormGroup } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export interface ArrayGroup extends NgxFbFormGroup<NgxFbArray> { type: 'arrays'; }
export type AppContent = TextControl | ArrayGroup;
`,
      ),
    ).rejects.toThrow(
      'ArrayGroup takes its children from core base types, but the content union has no member of their kind.',
    );
  });

  describe('property types beyond plain primitives and objects', () => {
    // An optional property's union keeps one arm once `undefined` is filtered out.
    const OPTIONAL_STRING = { k: 'union', members: [{ k: 'string' }] };

    let model: FormModel;
    let validate: (data: unknown) => boolean;

    const accepts = (property: string, value: unknown) =>
      validate({ content: { w: { type: 'wide', [property]: value } } });

    beforeEach(async () => {
      model = await modelFor(
        `import { NgxFbControl } from '@ngx-formbar/core';
export enum Size { Small, Large }
export enum Tone { Warm = 'warm', Cool = 'cool' }
export interface WideControl extends NgxFbControl {
  type: 'wide';
  width?: \`\${number}px\`;
  shout?: Uppercase<string>;
  tone?: 'warm' | 'cool' | (string & {});
  id?: string & { __brand: 'id' };
  pair?: [string, number];
  head?: readonly [string, number?];
  spread?: [string, ...number[]];
  tail?: [...string[], number];
  bag?: object;
  anything?: {};
  size?: Size;
  hue?: Tone;
}
export type AppContent = WideControl;
`,
      );
      validate = new Ajv2020({ strict: false }).compile(
        buildJsonSchema(model, DRAFT_2020_12, { docs: true }),
      );
    });

    it('maps template literal, string mapping and branded types to string', () => {
      const types = Object.fromEntries(
        model.nodes['WideControl'].properties.map((property) => [
          property.name,
          property.type,
        ]),
      );

      expect(types['width']).toEqual(OPTIONAL_STRING);
      expect(types['shout']).toEqual(OPTIONAL_STRING);
      expect(types['id']).toEqual(OPTIONAL_STRING);
    });

    it('accepts any string where a literal union is widened by string & {}', () => {
      expect(accepts('tone', 'warm')).toBe(true);
      expect(accepts('tone', 'anything')).toBe(true);
      expect(accepts('tone', 1)).toBe(false);
    });

    it('accepts the strings a template literal or branded type admits', () => {
      expect(accepts('width', '12px')).toBe(true);
      expect(accepts('shout', 'LOUD')).toBe(true);
      expect(accepts('id', 'abc')).toBe(true);
      expect(accepts('width', 12)).toBe(false);
    });

    it('validates a tuple by position and length', () => {
      expect(accepts('pair', ['a', 1])).toBe(true);
      expect(accepts('pair', ['a'])).toBe(false);
      expect(accepts('pair', ['a', 1, 2])).toBe(false);
      expect(accepts('pair', [1, 'a'])).toBe(false);
      expect(accepts('head', ['a'])).toBe(true);
      expect(accepts('head', ['a', 1, 2])).toBe(false);
      expect(accepts('spread', ['a', 1, 2])).toBe(true);
      expect(accepts('spread', ['a', 'b'])).toBe(false);
      expect(accepts('spread', [])).toBe(false);
      expect(accepts('tail', [1])).toBe(true);
      expect(accepts('tail', [])).toBe(false);
    });

    it('accepts any object or array for object, and any non-null value for {}', () => {
      expect(accepts('bag', { a: 1 })).toBe(true);
      expect(accepts('bag', [1])).toBe(true);
      expect(accepts('bag', 'x')).toBe(false);
      expect(accepts('anything', 'x')).toBe(true);
      expect(accepts('anything', { a: 1 })).toBe(true);
      expect(accepts('anything', null)).toBe(false);
    });

    it('restricts an enum to its member values', () => {
      expect(accepts('size', 1)).toBe(true);
      expect(accepts('size', 2)).toBe(false);
      expect(accepts('hue', 'cool')).toBe(true);
      expect(accepts('hue', 'hot')).toBe(false);
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

  it('leaves typeLiteral null when type is not narrowed', async () => {
    const loose = await modelFor(
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface LooseControl extends NgxFbControl { label?: string; }
export type AppContent = LooseControl;
`,
    );

    expect(loose.nodes['LooseControl'].typeLiteral).toBeNull();
  });

  it('rejects a type outside the narrowed discriminant literals', async () => {
    const model = await modelFor(
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface SelectControl extends NgxFbControl { type: 'select' | 'multiselect'; }
export type AppContent = SelectControl;
`,
    );
    const validate = new Ajv2020({ strict: false }).compile(
      buildJsonSchema(model, DRAFT_2020_12, { docs: true }),
    );

    expect(validate({ content: { pick: { type: 'select' } } })).toBe(true);
    expect(validate({ content: { pick: { type: 'multiselect' } } })).toBe(true);
    expect(validate({ content: { pick: { type: 'text' } } })).toBe(false);
  });

  it('rejects an object missing a required function-valued property', async () => {
    const model = await modelFor(
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface Options { id: string; transform: (value: unknown) => unknown; }
export interface SelectControl extends NgxFbControl { type: 'select'; options: Options; }
export type AppContent = SelectControl;
`,
    );
    const validate = new Ajv2020({ strict: false }).compile(
      buildJsonSchema(model, DRAFT_2020_12, { docs: true }),
    );

    expect(
      validate({
        content: { pick: { type: 'select', options: { id: 'a' } } },
      }),
    ).toBe(false);
  });

  it('maps a non-JSON primitive to the never node', async () => {
    const model = await modelFor(
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface BigControl extends NgxFbControl { type: 'big'; amount: bigint; }
export type AppContent = BigControl;
`,
    );
    const amount = model.nodes['BigControl'].properties.find(
      (property) => property.name === 'amount',
    );

    expect(amount?.type).toEqual({ k: 'never' });
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

  it('rejects a cycle that closes on an anonymous intersection', async () => {
    await expect(
      modelFor(
        `import { NgxFbControl } from '@ngx-formbar/core';
export interface Marker { tag: string; }
export interface Inter { self: Inter & Marker; }
export interface HolderControl extends NgxFbControl { type: 'holder'; a: Inter & Marker; }
export type AppContent = HolderControl;
`,
      ),
    ).rejects.toThrow('Property "self" cycles through the anonymous type');
  });

  it('rejects a named type whose cycle closes on an anonymous type', async () => {
    await expect(
      modelFor(
        `import { NgxFbControl } from '@ngx-formbar/core';
export interface Marker { tag: string; }
export interface Inter { self: Inter & Marker; }
export interface HolderControl extends NgxFbControl { type: 'holder'; c: Inter; }
export type AppContent = HolderControl;
`,
      ),
    ).rejects.toThrow('Property "self" cycles through the anonymous type');
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

  it('carries a consumer-authored intersection as a constraint', async () => {
    const narrowed = await modelFor(
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; required?: boolean; }
export type AppContent = TextControl & { required: true };
`,
    );

    expect(narrowed.root.members).toEqual(['TextControl']);
    expect(narrowed.root.constraints).toEqual([
      {
        name: 'required',
        optional: false,
        type: { k: 'literal', value: true },
      },
    ]);
    expect(narrowed.root.memberConstraints).toBeUndefined();
  });

  it('takes the declared interface as the node and every other arm as a constraint', async () => {
    const narrowed = await modelFor(
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; a?: string; b?: number; }
export type AppContent = TextControl & { a: string } & { b: number };
`,
    );

    expect(narrowed.root.members).toEqual(['TextControl']);
    expect(
      narrowed.root.constraints?.map((property) => property.name).sort(),
    ).toEqual(['a', 'b']);
  });

  it('carries a narrowing written on one arm on that member alone', async () => {
    const narrowed = await modelFor(
      `import { NgxFbControl, NgxFbBlock } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; required?: boolean; }
export interface NoteBlock extends NgxFbBlock { type: 'note'; message: string; }
export type AppContent = (TextControl & { required: true }) | NoteBlock;
`,
    );

    expect(narrowed.root.members).toEqual(['TextControl', 'NoteBlock']);
    expect(narrowed.root.memberConstraints).toEqual({
      TextControl: [
        {
          name: 'required',
          optional: false,
          type: { k: 'literal', value: true },
        },
      ],
    });
    expect(narrowed.root.constraints).toBeUndefined();
  });

  it('lists a node reached through a narrowed and a plain arm once, unnarrowed', async () => {
    const merged = await modelFor(
      `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; required?: boolean; }
export type AppContent = TextControl | (TextControl & { required: true });
`,
    );

    expect(merged.root.members).toEqual(['TextControl']);
    expect(merged.root.constraints).toBeUndefined();
    expect(merged.root.memberConstraints).toBeUndefined();
  });

  it('rejects a node reached through two differently narrowed arms', async () => {
    await expect(
      modelFor(
        `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; a?: string; b?: string; }
export type AppContent = (TextControl & { a: string }) | (TextControl & { b: string });
`,
      ),
    ).rejects.toThrow(
      'TextControl appears in one union under different narrowings',
    );
  });

  it('splits an array row per member when the union narrows one arm', async () => {
    const narrowed = await modelFor(
      `import { NgxFbControl, NgxFbBlock, NgxFbArray, NgxFbBaseContent, NgxFbItem } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; required?: boolean; }
export interface NoteBlock extends NgxFbBlock { type: 'note'; message: string; }
export interface RowArray<T extends NgxFbBaseContent = NgxFbItem> extends NgxFbArray<T> { type: 'array'; }
export type AppContent = (TextControl & { required: true }) | NoteBlock | RowArray<AppContent>;
`,
    );
    const row = narrowed.nodes['RowArray'].children;

    expect(row?.constraints).toBeUndefined();
    expect(
      Object.entries(row?.memberConstraints ?? {}).map(
        ([member, properties]) => [
          member,
          properties.map((property) => property.name).sort(),
        ],
      ),
    ).toEqual([
      ['TextControl', ['hideStrategy', 'required']],
      ['NoteBlock', ['hideStrategy']],
      ['RowArray', ['hideStrategy']],
    ]);
  });

  it('rejects a union member built from two declared interfaces', async () => {
    await expect(
      modelFor(
        `import { NgxFbControl } from '@ngx-formbar/core';
export interface TextControl extends NgxFbControl { type: 'text'; }
export interface Extra { extra?: string; }
export type AppContent = TextControl & Extra;
`,
      ),
    ).rejects.toThrow('does not extend a @ngx-formbar/core base type.');
  });
});
