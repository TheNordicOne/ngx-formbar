import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import Ajv from 'ajv';
import { EmptyTree, SchematicsException } from '@angular-devkit/schematics';
import { UnitTestTree } from '@angular-devkit/schematics/testing';
import { logging } from '@angular-devkit/core';
import {
  buildJsonSchema,
  DRAFT_07,
  DRAFT_2020_12,
} from '../schema/emitter/json-schema/build';
import {
  draft07Emitter,
  draft202012Emitter,
} from '../schema/emitter/json-schema/dialects';
import { EmitContext, EmitPaths } from '../schema/emitter/define-emitter';
import { builtInDefaultOutput } from '../schema/emitter/registry';
import { FormModel, Property, TypeNode } from '../schema/model';

const MODEL: FormModel = {
  root: { name: 'AppContent', members: ['TextControl', 'NoteBlock'] },
  nodes: {
    TextControl: {
      name: 'TextControl',
      kind: 'control',
      typeLiteral: ['text'],
      open: false,
      doc: 'A text input.',
      properties: [
        {
          name: 'label',
          optional: true,
          doc: 'The visible label.',
          type: { k: 'string' },
        },
        {
          name: 'hidden',
          optional: true,
          type: {
            k: 'union',
            members: [{ k: 'string' }, { k: 'function' }, { k: 'boolean' }],
          },
        },
      ],
    },
    NoteBlock: {
      name: 'NoteBlock',
      kind: 'block',
      typeLiteral: ['note'],
      open: true,
      properties: [
        {
          name: 'isControl',
          optional: false,
          type: { k: 'literal', value: false },
        },
        { name: 'message', optional: false, type: { k: 'string' } },
      ],
    },
  },
};

const VALID = {
  content: {
    firstName: { type: 'text', label: 'First name', hidden: 'false' },
    intro: { type: 'note', isControl: false, message: 'hi', anything: 1 },
  },
};

const INVALID = { content: { firstName: { type: 'text', typo: true } } };

const PATHS: EmitPaths = {
  workspaceRoot: '/',
  projectRoot: 'projects/test-app/src',
  output: null,
};

describe('dialect identifiers', () => {
  it('pins the 2020-12 draft URI', () => {
    expect(DRAFT_2020_12.id).toBe(
      'https://json-schema.org/draft/2020-12/schema',
    );
  });

  it('pins the draft-07 URI', () => {
    expect(DRAFT_07.id).toBe('http://json-schema.org/draft-07/schema#');
  });
});

describe('buildJsonSchema', () => {
  it('accepts a valid config and rejects an unknown property (2020-12)', () => {
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(
      buildJsonSchema(MODEL, DRAFT_2020_12, { docs: true }),
    );

    expect(validate(VALID)).toBe(true);
    expect(validate(INVALID)).toBe(false);
  });

  it('accepts a valid config and rejects an unknown property (draft-07)', () => {
    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile(
      buildJsonSchema(MODEL, DRAFT_07, { docs: true }),
    );

    expect(validate(VALID)).toBe(true);
    expect(validate(INVALID)).toBe(false);
  });

  it('accepts a config carrying $schema and rejects an unknown root key', () => {
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(
      buildJsonSchema(MODEL, DRAFT_2020_12, { docs: true }),
    );

    expect(validate({ $schema: './form.schema.json', ...VALID })).toBe(true);
    expect(validate({ ...VALID, extra: 'nope' })).toBe(false);
  });

  it('uses the dialect keywords', () => {
    const modern = buildJsonSchema(MODEL, DRAFT_2020_12, { docs: true });
    const legacy = buildJsonSchema(MODEL, DRAFT_07, { docs: true });

    expect(modern).toHaveProperty('$defs');
    expect(legacy).toHaveProperty('definitions');
  });

  it('drops the function arm of a property', () => {
    const document = buildJsonSchema(MODEL, DRAFT_2020_12, { docs: true });

    expect(
      at(document, '$defs', 'TextControl', 'properties', 'hidden'),
    ).toEqual({
      anyOf: [{ type: 'string' }, { type: 'boolean' }],
    });
  });

  it('keeps a block open and a control closed', () => {
    const document = buildJsonSchema(MODEL, DRAFT_2020_12, { docs: true });

    expect(at(document, '$defs', 'NoteBlock', 'additionalProperties')).toBe(
      true,
    );
    expect(at(document, '$defs', 'TextControl', 'additionalProperties')).toBe(
      false,
    );
  });

  it('emits the discriminant ahead of the declared properties', () => {
    // The document is read by people as well as validators, and `type` is what
    // tells them which node they are looking at.
    const document = buildJsonSchema(MODEL, DRAFT_2020_12, { docs: true });

    expect(keysAt(document, '$defs', 'NoteBlock', 'properties')).toEqual([
      'type',
      'isControl',
      'message',
    ]);
    expect(at(document, '$defs', 'NoteBlock', 'required')).toEqual([
      'type',
      'isControl',
      'message',
    ]);
  });

  it('emits the discriminant ahead of the structural child property', () => {
    const document = buildJsonSchema(nestingModel(), DRAFT_2020_12, {
      docs: true,
    });

    expect(keysAt(document, '$defs', 'Section', 'properties')).toEqual([
      'type',
      'controls',
    ]);
    expect(at(document, '$defs', 'Rows', 'required')).toEqual([
      'type',
      'rowControl',
    ]);
  });

  it('describes a node and a documented property with docs', () => {
    const document = buildJsonSchema(MODEL, DRAFT_2020_12, { docs: true });

    expect(at(document, '$defs', 'TextControl', 'description')).toBe(
      'A text input.',
    );
    expect(
      at(
        document,
        '$defs',
        'TextControl',
        'properties',
        'label',
        'description',
      ),
    ).toBe('The visible label.');
  });

  it('omits descriptions without docs', () => {
    const document = buildJsonSchema(MODEL, DRAFT_2020_12, { docs: false });

    expect(at(document, '$defs', 'TextControl', 'description')).toBeUndefined();
    expect(
      at(
        document,
        '$defs',
        'TextControl',
        'properties',
        'label',
        'description',
      ),
    ).toBeUndefined();
  });

  it('hoists a recursive declared object into $defs and validates nesting', () => {
    const document = buildJsonSchema(recursiveModel(), DRAFT_2020_12, {
      docs: true,
    });

    expect(at(document, '$defs')).toHaveProperty('OptionNode');

    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(document);

    expect(
      validate({
        content: {
          pick: {
            type: 'select',
            options: [
              {
                label: 'a',
                children: [{ label: 'b', children: [{ label: 'c' }] }],
              },
            ],
          },
        },
      }),
    ).toBe(true);
    expect(
      validate({
        content: {
          pick: { type: 'select', options: [{ label: 'a', nope: 1 }] },
        },
      }),
    ).toBe(false);
  });

  it('defines the child union a group and an array reference', () => {
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(
      buildJsonSchema(nestingModel(), DRAFT_2020_12, { docs: true }),
    );

    expect(
      validate({
        content: {
          rows: { type: 'array', rowControl: { type: 'text' } },
          section: { type: 'group', controls: { first: { type: 'text' } } },
        },
      }),
    ).toBe(true);
    expect(
      validate({
        content: {
          section: { type: 'group', controls: { first: { type: 'nope' } } },
        },
      }),
    ).toBe(false);
    expect(
      validate({
        content: { rows: { type: 'array', rowControl: { type: 'nope' } } },
      }),
    ).toBe(false);
  });

  it('applies a constrained reference as an allOf pair (2020-12)', () => {
    const document = buildJsonSchema(
      narrowedRowModel(KEEP_ONLY),
      DRAFT_2020_12,
      {
        docs: true,
      },
    );

    expect(at(document, '$defs', 'Rows', 'properties', 'rowControl')).toEqual({
      allOf: [
        { $ref: '#/$defs/AppItem' },
        { properties: { hideStrategy: { const: 'keep' } } },
      ],
    });
  });

  it('applies a constrained reference as an allOf pair (draft-07)', () => {
    const document = buildJsonSchema(narrowedRowModel(KEEP_ONLY), DRAFT_07, {
      docs: true,
    });

    expect(
      at(document, 'definitions', 'Rows', 'properties', 'rowControl'),
    ).toEqual({
      allOf: [
        { $ref: '#/definitions/AppItem' },
        { properties: { hideStrategy: { const: 'keep' } } },
      ],
    });
  });

  it('requires a constraint the model does not mark optional', () => {
    const document = buildJsonSchema(
      narrowedRowModel([
        {
          name: 'required',
          optional: false,
          type: { k: 'literal', value: true },
        },
      ]),
      DRAFT_2020_12,
      { docs: true },
    );

    expect(at(document, '$defs', 'Rows', 'properties', 'rowControl')).toEqual({
      allOf: [
        { $ref: '#/$defs/AppItem' },
        { properties: { required: { const: true } }, required: ['required'] },
      ],
    });
  });

  it('leaves the shared union definition unconstrained', () => {
    const document = buildJsonSchema(
      narrowedRowModel(KEEP_ONLY),
      DRAFT_2020_12,
      {
        docs: true,
      },
    );

    expect(at(document, '$defs', 'AppItem')).toEqual({
      anyOf: [{ $ref: '#/$defs/TextControl' }],
    });
    expect(at(document, '$defs', 'Section', 'properties', 'controls')).toEqual({
      type: 'object',
      additionalProperties: { $ref: '#/$defs/AppItem' },
    });
  });

  it('validates the narrowing on the row without losing the referenced node (2020-12)', () => {
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(
      buildJsonSchema(narrowedRowModel(KEEP_ONLY), DRAFT_2020_12, {
        docs: true,
      }),
    );

    expect(validate(rowForm('keep'))).toBe(true);
    expect(validate(rowForm())).toBe(true);
    expect(validate(rowForm('remove'))).toBe(false);
    // The same union used by the group keeps the strategy it declares.
    expect(
      validate({
        content: {
          section: {
            type: 'section',
            controls: { first: { type: 'text', hideStrategy: 'remove' } },
          },
        },
      }),
    ).toBe(true);
  });

  it('validates the narrowing on the row without losing the referenced node (draft-07)', () => {
    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile(
      buildJsonSchema(narrowedRowModel(KEEP_ONLY), DRAFT_07, { docs: true }),
    );

    expect(validate(rowForm('keep'))).toBe(true);
    expect(validate(rowForm())).toBe(true);
    expect(validate(rowForm('remove'))).toBe(false);
  });

  it('constrains the narrowed arm of a union definition (2020-12)', () => {
    const document = buildJsonSchema(memberNarrowedModel(), DRAFT_2020_12, {
      docs: true,
    });

    expect(at(document, '$defs', 'AppContent')).toEqual({
      anyOf: [
        {
          allOf: [
            { $ref: '#/$defs/TextControl' },
            {
              properties: { required: { const: true } },
              required: ['required'],
            },
          ],
        },
        { $ref: '#/$defs/NoteBlock' },
      ],
    });
  });

  it('constrains the narrowed arm of a union definition (draft-07)', () => {
    const document = buildJsonSchema(memberNarrowedModel(), DRAFT_07, {
      docs: true,
    });

    expect(at(document, 'definitions', 'AppContent')).toEqual({
      anyOf: [
        {
          allOf: [
            { $ref: '#/definitions/TextControl' },
            {
              properties: { required: { const: true } },
              required: ['required'],
            },
          ],
        },
        { $ref: '#/definitions/NoteBlock' },
      ],
    });
  });

  it('validates a narrowing written on one arm (2020-12)', () => {
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(
      buildJsonSchema(memberNarrowedModel(), DRAFT_2020_12, { docs: true }),
    );

    expect(validate(unionForm({ type: 'text', required: true }))).toBe(true);
    expect(validate(unionForm({ type: 'text' }))).toBe(false);
    expect(validate(unionForm({ type: 'note', message: 'hi' }))).toBe(true);
  });

  it('validates a narrowing written on one arm (draft-07)', () => {
    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile(
      buildJsonSchema(memberNarrowedModel(), DRAFT_07, { docs: true }),
    );

    expect(validate(unionForm({ type: 'text', required: true }))).toBe(true);
    expect(validate(unionForm({ type: 'text' }))).toBe(false);
    expect(validate(unionForm({ type: 'note', message: 'hi' }))).toBe(true);
  });

  it('applies a whole-union narrowing where the root union is used', () => {
    const model = memberNarrowedModel();
    const document = buildJsonSchema(
      {
        ...model,
        root: {
          name: 'AppContent',
          members: model.root.members,
          constraints: REQUIRED,
        },
      },
      DRAFT_2020_12,
      { docs: true },
    );

    expect(
      at(document, 'properties', 'content', 'additionalProperties'),
    ).toEqual({
      allOf: [
        { $ref: '#/$defs/AppContent' },
        { properties: { required: { const: true } }, required: ['required'] },
      ],
    });
    expect(at(document, '$defs', 'AppContent')).toEqual({
      anyOf: [{ $ref: '#/$defs/TextControl' }, { $ref: '#/$defs/NoteBlock' }],
    });
  });

  it('keeps two same-named shapes apart', () => {
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(
      buildJsonSchema(sameNameModel(), DRAFT_2020_12, { docs: true }),
    );

    expect(
      validate({
        content: { pair: { type: 'pair', left: { a: 'x' }, right: { b: 1 } } },
      }),
    ).toBe(true);
    expect(
      validate({
        content: { pair: { type: 'pair', left: { b: 1 }, right: { a: 'x' } } },
      }),
    ).toBe(false);
  });

  it('keeps a shared inner shape apart when its cycle binds to different outer shapes', () => {
    const validate = new Ajv2020({ strict: false }).compile(
      buildJsonSchema(sharedInnerCycleModel(), DRAFT_2020_12, { docs: true }),
    );
    const x = { a: 's', inner: {} };

    expect(
      validate({
        content: {
          c: {
            type: 'c',
            x,
            y: { b: 1, inner: { back: { b: 2, inner: {} } } },
          },
        },
      }),
    ).toBe(true);
    // `y.inner.back` must follow the `Outer` that `y` holds, which has `b`.
    expect(
      validate({
        content: { c: { type: 'c', x, y: { b: 1, inner: { back: x } } } },
      }),
    ).toBe(false);
  });

  it('binds a cycle to the innermost enclosing shape of that name', () => {
    const document = buildJsonSchema(shadowedCycleModel(), DRAFT_2020_12, {
      docs: true,
    });
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(document);

    expect(
      validate({
        content: {
          tree: {
            type: 'tree',
            outer: { inner: { tag: 'a', next: { tag: 'b' } } },
          },
        },
      }),
    ).toBe(true);
    // `next` must follow the inner `Node`, which has no `label`.
    expect(
      validate({
        content: {
          tree: {
            type: 'tree',
            outer: { inner: { tag: 'a', next: { label: 'b' } } },
          },
        },
      }),
    ).toBe(false);
  });

  it('throws when a union alias collides with a node name', () => {
    const colliding: FormModel = {
      root: { name: 'AppContent', members: ['Section', 'Rows'] },
      nodes: {
        Section: {
          name: 'Section',
          kind: 'group',
          typeLiteral: ['group'],
          open: false,
          properties: [],
          children: { name: 'Rows', members: ['Rows'] },
        },
        Rows: {
          name: 'Rows',
          kind: 'control',
          typeLiteral: ['rows'],
          open: false,
          properties: [],
        },
      },
    };

    expect(() =>
      buildJsonSchema(colliding, DRAFT_2020_12, { docs: true }),
    ).toThrow(/Rows/);
  });

  it('rejects a cycle that has no enclosing shape', () => {
    const dangling: FormModel = {
      root: { name: 'AppContent', members: ['Control'] },
      nodes: {
        Control: {
          name: 'Control',
          kind: 'control',
          typeLiteral: ['dangling'],
          open: false,
          properties: [
            {
              name: 'loop',
              optional: false,
              type: { k: 'cycle', name: 'Absent' },
            },
          ],
        },
      },
    };

    expect(() =>
      buildJsonSchema(dangling, DRAFT_2020_12, { docs: true }),
    ).toThrow(/Absent/);
  });

  it('rejects a reference to a node the model does not define', () => {
    const dangling: FormModel = {
      root: { name: 'AppContent', members: ['Control'] },
      nodes: {
        Control: {
          name: 'Control',
          kind: 'control',
          typeLiteral: ['dangling'],
          open: false,
          properties: [
            {
              name: 'target',
              optional: false,
              type: { k: 'ref', node: 'Missing' },
            },
          ],
        },
      },
    };

    expect(() =>
      buildJsonSchema(dangling, DRAFT_2020_12, { docs: true }),
    ).toThrow('No definition name is reserved for "Missing".');
  });

  it('resolves references whose type names hold pointer and URI characters (2020-12)', () => {
    const validate = new Ajv2020({ strict: false }).compile(
      buildJsonSchema(printedNameModel(), DRAFT_2020_12, { docs: true }),
    );

    expect(validate(printedNameForm('x'))).toBe(true);
    expect(validate(printedNameForm(1))).toBe(false);
  });

  it('resolves references whose type names hold pointer and URI characters (draft-07)', () => {
    const validate = new Ajv({ strict: false }).compile(
      buildJsonSchema(printedNameModel(), DRAFT_07, { docs: true }),
    );

    expect(validate(printedNameForm('x'))).toBe(true);
    expect(validate(printedNameForm(1))).toBe(false);
  });

  it('names every definition with a plain identifier', () => {
    const document = buildJsonSchema(printedNameModel(), DRAFT_2020_12, {
      docs: true,
    });

    expect(keysAt(document, '$defs')).toEqual([
      'Pick_AppContent',
      'Pick_AppContent2',
      'Root_a_b',
      'Record_a_b_c_string',
      'Record_a_b_c_string2',
    ]);
  });

  it('types tuple positions with prefixItems (2020-12)', () => {
    const document = buildJsonSchema(tupleModel(), DRAFT_2020_12, {
      docs: true,
    });

    expect(at(document, '$defs', 'TupleControl', 'properties', 'pair')).toEqual(
      {
        type: 'array',
        prefixItems: [{ type: 'string' }, { type: 'number' }],
        items: false,
        minItems: 2,
      },
    );
    expect(
      at(document, '$defs', 'TupleControl', 'properties', 'spread'),
    ).toEqual({ type: 'array', items: { type: 'number' }, minItems: 1 });
  });

  it('types tuple positions with an items array (draft-07)', () => {
    const document = buildJsonSchema(tupleModel(), DRAFT_07, { docs: true });

    expect(
      at(document, 'definitions', 'TupleControl', 'properties', 'pair'),
    ).toEqual({
      type: 'array',
      items: [{ type: 'string' }, { type: 'number' }],
      additionalItems: false,
      minItems: 2,
    });
  });

  it('validates tuples by position and length (2020-12)', () => {
    const validate = new Ajv2020({ strict: false }).compile(
      buildJsonSchema(tupleModel(), DRAFT_2020_12, { docs: true }),
    );

    expect(validate(tupleForm(['a', 1]))).toBe(true);
    expect(validate(tupleForm(['a']))).toBe(false);
    expect(validate(tupleForm(['a', 1, 2]))).toBe(false);
    expect(validate(tupleForm([1, 'a']))).toBe(false);
    expect(validate(tupleForm(['a', 1], [1, 2, 3]))).toBe(true);
    expect(validate(tupleForm(['a', 1], []))).toBe(false);
    expect(validate(tupleForm(['a', 1], ['x']))).toBe(false);
  });

  it('validates tuples by position and length (draft-07)', () => {
    const validate = new Ajv({ strict: false }).compile(
      buildJsonSchema(tupleModel(), DRAFT_07, { docs: true }),
    );

    expect(validate(tupleForm(['a', 1]))).toBe(true);
    expect(validate(tupleForm(['a']))).toBe(false);
    expect(validate(tupleForm(['a', 1, 2]))).toBe(false);
    expect(validate(tupleForm([1, 'a']))).toBe(false);
    expect(validate(tupleForm(['a', 1], [1, 2, 3]))).toBe(true);
    expect(validate(tupleForm(['a', 1], []))).toBe(false);
    expect(validate(tupleForm(['a', 1], ['x']))).toBe(false);
  });

  it('defines a declared object once however often it is used', () => {
    const document = buildJsonSchema(reusedObjectModel(), DRAFT_2020_12, {
      docs: true,
    });

    expect(keysAt(document, '$defs')).toEqual([
      'ListControl',
      'AppContent',
      'OptionNode',
    ]);
    expect(at(document, '$defs', 'ListControl', 'properties')).toEqual({
      type: { const: 'list' },
      first: { $ref: '#/$defs/OptionNode' },
      second: { $ref: '#/$defs/OptionNode' },
    });
  });

  it('keeps cycles bound when a recursive declared object is reused', () => {
    const validate = new Ajv2020({ strict: false }).compile(
      buildJsonSchema(reusedObjectModel(), DRAFT_2020_12, { docs: true }),
    );
    const tree = { label: 'a', children: [{ label: 'b', children: [] }] };

    expect(
      validate({
        content: { list: { type: 'list', first: tree, second: tree } },
      }),
    ).toBe(true);
    expect(
      validate({
        content: {
          list: {
            type: 'list',
            first: tree,
            second: { label: 'a', children: [{ nope: 1 }] },
          },
        },
      }),
    ).toBe(false);
  });
});

describe('buildJsonSchema document shape', () => {
  it('names an inline root union FormContent', () => {
    const document = buildJsonSchema(
      { ...controlModel(), root: { name: null, members: ['C'] } },
      DRAFT_2020_12,
      { docs: true },
    );

    expect(keysAt(document, '$defs')).toEqual(['C', 'FormContent']);
    expect(
      at(document, 'properties', 'content', 'additionalProperties'),
    ).toEqual({ $ref: '#/$defs/FormContent' });
  });

  it('names an inline child union after its node', () => {
    const document = buildJsonSchema(nestingModel(), DRAFT_2020_12, {
      docs: true,
    });

    expect(at(document, '$defs', 'Rows', 'properties', 'rowControl')).toEqual({
      $ref: '#/$defs/RowsChildren',
    });
    expect(at(document, '$defs', 'RowsChildren')).toEqual({
      anyOf: [{ $ref: '#/$defs/TextControl' }],
    });
  });

  it('requires content and a string $schema', () => {
    const validate = new Ajv2020({ strict: false }).compile(
      buildJsonSchema(MODEL, DRAFT_2020_12, { docs: true }),
    );

    expect(validate({})).toBe(false);
    expect(validate({ $schema: 1, ...VALID })).toBe(false);
  });

  it('requires the controls of a group', () => {
    const validate = new Ajv2020({ strict: false }).compile(
      buildJsonSchema(nestingModel(), DRAFT_2020_12, { docs: true }),
    );

    expect(validate({ content: { section: { type: 'group' } } })).toBe(false);
  });

  it('leaves the discriminant an open string without a literal', () => {
    const model = controlModel();
    model.nodes['C'].typeLiteral = null;

    const document = buildJsonSchema(model, DRAFT_2020_12, { docs: true });

    expect(at(document, '$defs', 'C', 'properties', 'type')).toEqual({
      type: 'string',
    });
  });

  it('lists the literals of a discriminant with several', () => {
    const model = controlModel();
    model.nodes['C'].typeLiteral = ['a', 'b'];

    const document = buildJsonSchema(model, DRAFT_2020_12, { docs: true });

    expect(at(document, '$defs', 'C', 'properties', 'type')).toEqual({
      enum: ['a', 'b'],
    });
  });

  it.each<[string, TypeNode, object]>([
    ['null', { k: 'null' }, { type: 'null' }],
    ['any', { k: 'any' }, {}],
    ['unknown', { k: 'unknown' }, {}],
  ])('emits a %s property', (_, type, schema) => {
    const document = buildJsonSchema(
      controlModel({ name: 'p', optional: false, type }),
      DRAFT_2020_12,
      { docs: true },
    );

    expect(at(document, '$defs', 'C', 'properties', 'p')).toEqual(schema);
  });

  it('states no length for a tuple that needs no item', () => {
    const document = buildJsonSchema(
      controlModel({
        name: 'p',
        optional: false,
        type: { k: 'tuple', elements: [{ k: 'string' }], minItems: 0 },
      }),
      DRAFT_2020_12,
      { docs: true },
    );

    expect(at(document, '$defs', 'C', 'properties', 'p')).toEqual({
      type: 'array',
      prefixItems: [{ type: 'string' }],
      items: false,
    });
  });

  it('keeps a documented property nothing satisfies a plain false', () => {
    const document = buildJsonSchema(
      controlModel({
        name: 'p',
        optional: false,
        doc: 'A callback.',
        type: { k: 'function' },
      }),
      DRAFT_2020_12,
      { docs: true },
    );

    expect(at(document, '$defs', 'C', 'properties', 'p')).toBe(false);
  });

  it('adds no description key to an undocumented property', () => {
    const document = buildJsonSchema(
      controlModel({ name: 'p', optional: false, type: { k: 'string' } }),
      DRAFT_2020_12,
      { docs: true },
    );

    expect(at(document, '$defs', 'C', 'properties', 'p')).not.toHaveProperty(
      'description',
    );
  });

  it('counts up through the names of same-named shapes', () => {
    const shape = (name: string): Property => ({
      name,
      optional: false,
      type: {
        k: 'object',
        name: 'Options',
        properties: [{ name, optional: false, type: { k: 'string' } }],
      },
    });
    const document = buildJsonSchema(
      controlModel(shape('a'), shape('b'), shape('c')),
      DRAFT_2020_12,
      { docs: true },
    );

    expect(keysAt(document, '$defs')).toEqual([
      'C',
      'AppContent',
      'Options',
      'Options2',
      'Options3',
    ]);
  });

  it.each([
    ['__Options__', 'Options'],
    ['<>', 'Type'],
  ])('defines a shape printed as %s under %s', (printed, defName) => {
    const document = buildJsonSchema(
      controlModel({
        name: 'p',
        optional: false,
        type: { k: 'object', name: printed, properties: [] },
      }),
      DRAFT_2020_12,
      { docs: true },
    );

    expect(at(document, '$defs', 'C', 'properties', 'p')).toEqual({
      $ref: `#/$defs/${defName}`,
    });
  });

  const CYCLE: TypeNode = { k: 'cycle', name: 'Outer' };

  it.each<[string, TypeNode]>([
    ['an array', { k: 'array', items: CYCLE }],
    ['a tuple position', { k: 'tuple', elements: [CYCLE], minItems: 0 }],
    ['a tuple rest', { k: 'tuple', elements: [], minItems: 0, rest: CYCLE }],
    ['a union', { k: 'union', members: [CYCLE, { k: 'string' }] }],
    ['an index signature', { k: 'object', properties: [], index: CYCLE }],
  ])('sees a cycle through %s when sharing a shape', (_, back) => {
    const leaf: TypeNode = {
      k: 'object',
      name: 'Leaf',
      properties: [{ name: 'back', optional: true, type: back }],
    };
    const outer = (name: string): Property => ({
      name,
      optional: false,
      type: {
        k: 'object',
        name: 'Outer',
        properties: [
          { name: 'leaf', optional: false, type: leaf },
          { name, optional: false, type: { k: 'string' } },
        ],
      },
    });
    const document = buildJsonSchema(
      controlModel(outer('a'), outer('b')),
      DRAFT_2020_12,
      { docs: true },
    );

    expect(keysAt(document, '$defs')).toEqual(
      expect.arrayContaining(['Leaf', 'Leaf2']),
    );
  });
});

describe('the built-in emitters', () => {
  it.each([
    [draft202012Emitter, '/projects/test-app/src/form.schema.json'],
    [draft07Emitter, '/projects/test-app/src/form.schema.draft-07.json'],
  ])(
    'gives a built-in a default output under the project root',
    (emitter, output) => {
      expect(builtInDefaultOutput(emitter.name, PATHS.projectRoot)).toBe(
        output,
      );
    },
  );

  it('has no default output for anything but a built-in', () => {
    expect(builtInDefaultOutput('./tools/a.ts', PATHS.projectRoot)).toBeNull();
  });

  it('writes to the output it receives', async () => {
    const tree = new UnitTestTree(new EmptyTree());

    await draft202012Emitter.emit(
      MODEL,
      context(tree, { ...PATHS, output: 'schemas/form.json' }),
    );

    expect(JSON.parse(tree.readContent('schemas/form.json'))).toEqual(
      buildJsonSchema(MODEL, DRAFT_2020_12, { docs: true }),
    );
  });

  it('fails without an output', () => {
    const tree = new UnitTestTree(new EmptyTree());

    expect(() => draft07Emitter.emit(MODEL, context(tree, PATHS))).toThrow(
      `The "${draft07Emitter.name}" emitter received no output path.`,
    );
  });

  it('overwrites the configured output file', async () => {
    const tree = new UnitTestTree(new EmptyTree());
    tree.create('schemas/form.json', 'stale');

    await draft07Emitter.emit(
      MODEL,
      context(tree, { ...PATHS, output: 'schemas/form.json' }),
    );

    expect(JSON.parse(tree.readContent('schemas/form.json'))).toEqual(
      buildJsonSchema(MODEL, DRAFT_07, { docs: true }),
    );
  });

  it('renders no descriptions with options.docs: false', async () => {
    const tree = new UnitTestTree(new EmptyTree());

    await draft202012Emitter.emit(
      MODEL,
      context(
        tree,
        { ...PATHS, output: 'projects/test-app/src/form.schema.json' },
        { docs: false },
      ),
    );

    expect(
      JSON.parse(tree.readContent('projects/test-app/src/form.schema.json')),
    ).toEqual(buildJsonSchema(MODEL, DRAFT_2020_12, { docs: false }));
  });

  describe.each([
    ['json-schema-2020-12', draft202012Emitter, '$defs'],
    ['json-schema-draft-07', draft07Emitter, 'definitions'],
  ])('%s', (name, emitter, defsKeyword) => {
    const OUTPUT = { ...PATHS, output: 'schemas/form.json' };

    it('renders descriptions by default', async () => {
      const tree = new UnitTestTree(new EmptyTree());

      await emitter.emit(MODEL, context(tree, OUTPUT));

      expect(
        at(
          JSON.parse(tree.readContent('schemas/form.json')),
          defsKeyword,
          'TextControl',
          'description',
        ),
      ).toBe('A text input.');
    });

    it.each([
      ['a string', 'false', '"false"'],
      ['a number', 0, '0'],
      ['null', null, 'null'],
    ])('names itself when docs is %s', (_, docs, printed) => {
      const tree = new UnitTestTree(new EmptyTree());
      const emit = () => emitter.emit(MODEL, context(tree, OUTPUT, { docs }));

      expect(emit).toThrow(SchematicsException);
      expect(emit).toThrow(
        `"options.docs" of the "${name}" emitter must be a boolean, got ${printed}.`,
      );
    });
  });
});

/** Walks the emitted document, which is deliberately typed only as an object. */
function at(value: unknown, ...path: string[]): unknown {
  let current = value;

  for (const key of path) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }

    const next: unknown = Reflect.get(current, key);
    current = next;
  }

  return current;
}

function keysAt(value: unknown, ...path: string[]) {
  const target = at(value, ...path);

  return typeof target === 'object' && target !== null
    ? Object.keys(target)
    : null;
}

function context(
  tree: UnitTestTree,
  paths: EmitPaths,
  options: EmitContext['options'] = {},
): EmitContext {
  return {
    tree,
    options,
    logger: new logging.NullLogger(),
    paths,
  };
}

function controlModel(...properties: Property[]): FormModel {
  return {
    root: { name: 'AppContent', members: ['C'] },
    nodes: {
      C: {
        name: 'C',
        kind: 'control',
        typeLiteral: ['c'],
        open: false,
        properties,
      },
    },
  };
}

/** `SelectControl.options` holds `OptionNode`s that nest through `children`. */
function recursiveModel(): FormModel {
  return {
    root: { name: 'AppContent', members: ['SelectControl'] },
    nodes: {
      SelectControl: {
        name: 'SelectControl',
        kind: 'control',
        typeLiteral: ['select'],
        open: false,
        properties: [
          {
            name: 'options',
            optional: false,
            type: {
              k: 'array',
              items: {
                k: 'object',
                name: 'OptionNode',
                properties: [
                  { name: 'label', optional: false, type: { k: 'string' } },
                  {
                    name: 'children',
                    optional: true,
                    type: {
                      k: 'array',
                      items: { k: 'cycle', name: 'OptionNode' },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  };
}

/** A group holds its children behind a named union, an array holds an inline one. */
function nestingModel(): FormModel {
  return {
    root: { name: 'AppContent', members: ['TextControl', 'Section', 'Rows'] },
    nodes: {
      TextControl: {
        name: 'TextControl',
        kind: 'control',
        typeLiteral: ['text'],
        open: false,
        properties: [],
      },
      Section: {
        name: 'Section',
        kind: 'group',
        typeLiteral: ['group'],
        open: false,
        properties: [],
        children: { name: 'SectionItem', members: ['TextControl'] },
      },
      Rows: {
        name: 'Rows',
        kind: 'array',
        typeLiteral: ['array'],
        open: false,
        properties: [],
        children: { name: null, members: ['TextControl'] },
      },
    },
  };
}

const KEEP_ONLY: Property[] = [
  {
    name: 'hideStrategy',
    optional: true,
    type: { k: 'literal', value: 'keep' },
  },
];

const REQUIRED: Property[] = [
  { name: 'required', optional: false, type: { k: 'literal', value: true } },
];

function unionForm(value: object) {
  return { content: { only: value } };
}

/** Only the `TextControl` arm of the union is narrowed, by the union itself. */
function memberNarrowedModel(): FormModel {
  return {
    root: {
      name: 'AppContent',
      members: ['TextControl', 'NoteBlock'],
      memberConstraints: { TextControl: REQUIRED },
    },
    nodes: {
      TextControl: {
        name: 'TextControl',
        kind: 'control',
        typeLiteral: ['text'],
        open: false,
        properties: [
          { name: 'required', optional: true, type: { k: 'boolean' } },
        ],
      },
      NoteBlock: {
        name: 'NoteBlock',
        kind: 'block',
        typeLiteral: ['note'],
        open: true,
        properties: [
          { name: 'message', optional: false, type: { k: 'string' } },
        ],
      },
    },
  };
}

function rowForm(hideStrategy?: string) {
  const rowControl =
    hideStrategy === undefined
      ? { type: 'text' }
      : { type: 'text', hideStrategy };

  return { content: { rows: { type: 'array', rowControl } } };
}

/**
 * A group and an array point at the same named child union, and only the array's
 * row is narrowed. `hideStrategy` is declared on the node so the narrowing has
 * something wider to cut down.
 */
function narrowedRowModel(constraints: Property[]): FormModel {
  return {
    root: { name: 'AppContent', members: ['TextControl', 'Section', 'Rows'] },
    nodes: {
      TextControl: {
        name: 'TextControl',
        kind: 'control',
        typeLiteral: ['text'],
        open: false,
        properties: [
          {
            name: 'hideStrategy',
            optional: true,
            type: {
              k: 'union',
              members: [
                { k: 'literal', value: 'keep' },
                { k: 'literal', value: 'remove' },
              ],
            },
          },
        ],
      },
      Section: {
        name: 'Section',
        kind: 'group',
        typeLiteral: ['section'],
        open: false,
        properties: [],
        children: { name: 'AppItem', members: ['TextControl'] },
      },
      Rows: {
        name: 'Rows',
        kind: 'array',
        typeLiteral: ['array'],
        open: false,
        properties: [],
        children: { name: 'AppItem', members: ['TextControl'], constraints },
      },
    },
  };
}

/** Two unrelated interfaces both print as `Options`, as `typeToString` reports them. */
function sameNameModel(): FormModel {
  return {
    root: { name: 'AppContent', members: ['PairControl'] },
    nodes: {
      PairControl: {
        name: 'PairControl',
        kind: 'control',
        typeLiteral: ['pair'],
        open: false,
        properties: [
          {
            name: 'left',
            optional: false,
            type: {
              k: 'object',
              name: 'Options',
              properties: [
                { name: 'a', optional: false, type: { k: 'string' } },
              ],
            },
          },
          {
            name: 'right',
            optional: false,
            type: {
              k: 'object',
              name: 'Options',
              properties: [
                { name: 'b', optional: false, type: { k: 'number' } },
              ],
            },
          },
        ],
      },
    },
  };
}

function printedNameForm(value: unknown) {
  return {
    content: {
      pick: {
        type: 'pick',
        tilde: { 'a/b~c': 'x' },
        slash: { 'a/b~c': value },
      },
      other: { type: 'other' },
    },
  };
}

/**
 * Names as `checker.typeToString` prints them: `/` and `~` are JSON Pointer
 * syntax, and `<`, `>`, `"` and spaces are not allowed in a URI fragment. Two
 * of them collapse onto the same identifier and must stay apart.
 */
function printedNameModel(): FormModel {
  const record = (name: string): TypeNode => ({
    k: 'object',
    name,
    properties: [{ name: 'a/b~c', optional: false, type: { k: 'string' } }],
  });

  return {
    root: {
      name: 'Root<"a/b">',
      members: ['Pick<AppContent>', 'Pick<"AppContent">'],
    },
    nodes: {
      'Pick<AppContent>': {
        name: 'Pick<AppContent>',
        kind: 'control',
        typeLiteral: ['pick'],
        open: false,
        properties: [
          {
            name: 'tilde',
            optional: false,
            type: record('Record<"a/b~c", string>'),
          },
          {
            name: 'slash',
            optional: false,
            type: record('Record<"a/b~c", string >'),
          },
        ],
      },
      'Pick<"AppContent">': {
        name: 'Pick<"AppContent">',
        kind: 'control',
        typeLiteral: ['other'],
        open: false,
        properties: [],
      },
    },
  };
}

function tupleForm(pair: unknown, spread: unknown = [1]) {
  return { content: { t: { type: 'tuple', pair, spread } } };
}

/** `pair` is `[string, number]`, `spread` is `[...number[], number]`. */
function tupleModel(): FormModel {
  return {
    root: { name: 'AppContent', members: ['TupleControl'] },
    nodes: {
      TupleControl: {
        name: 'TupleControl',
        kind: 'control',
        typeLiteral: ['tuple'],
        open: false,
        properties: [
          {
            name: 'pair',
            optional: false,
            type: {
              k: 'tuple',
              elements: [{ k: 'string' }, { k: 'number' }],
              minItems: 2,
            },
          },
          {
            name: 'spread',
            optional: false,
            type: {
              k: 'tuple',
              elements: [],
              minItems: 1,
              rest: { k: 'number' },
            },
          },
        ],
      },
    },
  };
}

/** `ListControl` uses the recursive `OptionNode` in two properties. */
function reusedObjectModel(): FormModel {
  const optionNode: TypeNode = {
    k: 'object',
    name: 'OptionNode',
    properties: [
      { name: 'label', optional: false, type: { k: 'string' } },
      {
        name: 'children',
        optional: true,
        type: { k: 'array', items: { k: 'cycle', name: 'OptionNode' } },
      },
    ],
  };

  return {
    root: { name: 'AppContent', members: ['ListControl'] },
    nodes: {
      ListControl: {
        name: 'ListControl',
        kind: 'control',
        typeLiteral: ['list'],
        open: false,
        properties: [
          { name: 'first', optional: false, type: optionNode },
          { name: 'second', optional: false, type: optionNode },
        ],
      },
    },
  };
}

/** An inner `Node` shadows an outer one, and the cycle sits inside the inner. */
function shadowedCycleModel(): FormModel {
  return {
    root: { name: 'AppContent', members: ['TreeControl'] },
    nodes: {
      TreeControl: {
        name: 'TreeControl',
        kind: 'control',
        typeLiteral: ['tree'],
        open: false,
        properties: [
          {
            name: 'outer',
            optional: false,
            type: {
              k: 'object',
              name: 'Node',
              properties: [
                { name: 'label', optional: true, type: { k: 'string' } },
                {
                  name: 'inner',
                  optional: false,
                  type: {
                    k: 'object',
                    name: 'Node',
                    properties: [
                      { name: 'tag', optional: false, type: { k: 'string' } },
                      {
                        name: 'next',
                        optional: true,
                        type: { k: 'cycle', name: 'Node' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  };
}

/**
 * Two unrelated shapes both print as `Outer` and hold the same `Inner`, whose
 * `back` cycles out to whichever `Outer` encloses it.
 */
function sharedInnerCycleModel(): FormModel {
  const inner: TypeNode = {
    k: 'object',
    name: 'Inner',
    properties: [
      { name: 'back', optional: true, type: { k: 'cycle', name: 'Outer' } },
    ],
  };

  return {
    root: { name: 'AppContent', members: ['C'] },
    nodes: {
      C: {
        name: 'C',
        kind: 'control',
        typeLiteral: ['c'],
        open: false,
        properties: [
          {
            name: 'x',
            optional: false,
            type: {
              k: 'object',
              name: 'Outer',
              properties: [
                { name: 'inner', optional: false, type: inner },
                { name: 'a', optional: false, type: { k: 'string' } },
              ],
            },
          },
          {
            name: 'y',
            optional: false,
            type: {
              k: 'object',
              name: 'Outer',
              properties: [
                { name: 'inner', optional: false, type: inner },
                { name: 'b', optional: false, type: { k: 'number' } },
              ],
            },
          },
        ],
      },
    },
  };
}
