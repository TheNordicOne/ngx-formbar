import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import Ajv from 'ajv';
import { EmptyTree } from '@angular-devkit/schematics';
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
import { FormModel, Property } from '../schema/model';

const MODEL: FormModel = {
  root: { name: 'AppContent', members: ['TextControl', 'NoteBlock'] },
  nodes: {
    TextControl: {
      name: 'TextControl',
      kind: 'control',
      typeLiteral: 'text',
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
      typeLiteral: 'note',
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

  it('describes a node and a documented property when docs are enabled', () => {
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

  it('omits descriptions when docs are disabled', () => {
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
          typeLiteral: 'group',
          open: false,
          properties: [],
          children: { name: 'Rows', members: ['Rows'] },
        },
        Rows: {
          name: 'Rows',
          kind: 'control',
          typeLiteral: 'rows',
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
          typeLiteral: 'dangling',
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
});

describe('the built-in emitters', () => {
  it('writes the document under the project root by default', async () => {
    const tree = new UnitTestTree(new EmptyTree());

    await draft202012Emitter.emit(MODEL, context(tree, PATHS));

    expect(
      JSON.parse(tree.readContent('projects/test-app/src/form.schema.json')),
    ).toEqual(buildJsonSchema(MODEL, DRAFT_2020_12, { docs: true }));
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

  it('forwards the emit options instead of hardcoding them', async () => {
    const tree = new UnitTestTree(new EmptyTree());

    await draft202012Emitter.emit(MODEL, context(tree, PATHS, { docs: false }));

    expect(
      JSON.parse(tree.readContent('projects/test-app/src/form.schema.json')),
    ).toEqual(buildJsonSchema(MODEL, DRAFT_2020_12, { docs: false }));
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

function context(
  tree: UnitTestTree,
  paths: EmitPaths,
  options: EmitContext['options'] = { docs: true },
): EmitContext {
  return {
    tree,
    options,
    logger: new logging.NullLogger(),
    paths,
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
        typeLiteral: 'select',
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
        typeLiteral: 'text',
        open: false,
        properties: [],
      },
      Section: {
        name: 'Section',
        kind: 'group',
        typeLiteral: 'group',
        open: false,
        properties: [],
        children: { name: 'SectionItem', members: ['TextControl'] },
      },
      Rows: {
        name: 'Rows',
        kind: 'array',
        typeLiteral: 'array',
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
        typeLiteral: 'text',
        open: false,
        properties: [
          { name: 'required', optional: true, type: { k: 'boolean' } },
        ],
      },
      NoteBlock: {
        name: 'NoteBlock',
        kind: 'block',
        typeLiteral: 'note',
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
        typeLiteral: 'text',
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
        typeLiteral: 'section',
        open: false,
        properties: [],
        children: { name: 'AppItem', members: ['TextControl'] },
      },
      Rows: {
        name: 'Rows',
        kind: 'array',
        typeLiteral: 'array',
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
        typeLiteral: 'pair',
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

/** An inner `Node` shadows an outer one, and the cycle sits inside the inner. */
function shadowedCycleModel(): FormModel {
  return {
    root: { name: 'AppContent', members: ['TreeControl'] },
    nodes: {
      TreeControl: {
        name: 'TreeControl',
        kind: 'control',
        typeLiteral: 'tree',
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
