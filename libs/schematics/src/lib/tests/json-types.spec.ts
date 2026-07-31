import { describe, expect, it } from 'vitest';
import { toJsonTypes } from '../schema/json-types';
import { TypeNode } from '../schema/model';

/** Every arm the projection can reach, nested so each one is exercised twice. */
const EVERY_KIND: TypeNode = {
  k: 'object',
  name: 'Outer',
  properties: [
    { name: 'gone', optional: false, type: { k: 'function' } },
    { name: 'text', optional: true, type: { k: 'string' } },
    { name: 'count', optional: false, type: { k: 'number' } },
    { name: 'flag', optional: false, type: { k: 'boolean' } },
    { name: 'nothing', optional: true, type: { k: 'null' } },
    { name: 'whatever', optional: true, type: { k: 'unknown' } },
    { name: 'loose', optional: true, type: { k: 'any' } },
    { name: 'literal', optional: false, type: { k: 'literal', value: 'a' } },
    { name: 'node', optional: false, type: { k: 'ref', node: 'TextControl' } },
    { name: 'loop', optional: true, type: { k: 'cycle', name: 'Outer' } },
    {
      name: 'oneArm',
      optional: true,
      type: { k: 'union', members: [{ k: 'string' }, { k: 'function' }] },
    },
    {
      name: 'twoArms',
      optional: true,
      type: { k: 'union', members: [{ k: 'string' }, { k: 'number' }] },
    },
    {
      name: 'list',
      optional: false,
      type: {
        k: 'array',
        items: {
          k: 'object',
          properties: [
            { name: 'dropped', optional: false, type: { k: 'function' } },
            { name: 'kept', optional: true, type: { k: 'string' } },
          ],
          index: { k: 'function' },
        },
      },
    },
  ],
  index: { k: 'union', members: [{ k: 'number' }, { k: 'function' }] },
};

describe('toJsonTypes', () => {
  // The emitter projects once and then walks the result. That is only safe if a
  // second pass is a no-op, so the property is pinned rather than assumed.
  it('leaves an already-projected tree unchanged', () => {
    const once = toJsonTypes(EVERY_KIND);

    expect(once).not.toBeNull();
    expect(once === null ? null : toJsonTypes(once)).toEqual(once);
  });

  it('drops the function arm of a union', () => {
    expect(
      toJsonTypes({
        k: 'union',
        members: [{ k: 'string' }, { k: 'function' }, { k: 'boolean' }],
      }),
    ).toEqual({ k: 'union', members: [{ k: 'string' }, { k: 'boolean' }] });
  });

  it('collapses a union with one surviving arm', () => {
    expect(
      toJsonTypes({
        k: 'union',
        members: [{ k: 'string' }, { k: 'function' }],
      }),
    ).toEqual({ k: 'string' });
  });

  it('returns null when nothing survives', () => {
    expect(toJsonTypes({ k: 'function' })).toBeNull();
  });

  it('recurses into arrays and objects', () => {
    expect(
      toJsonTypes({
        k: 'object',
        properties: [
          { name: 'a', optional: false, type: { k: 'function' } },
          {
            name: 'b',
            optional: false,
            type: { k: 'array', items: { k: 'string' } },
          },
        ],
      }),
    ).toEqual({
      k: 'object',
      properties: [
        {
          name: 'b',
          optional: false,
          type: { k: 'array', items: { k: 'string' } },
        },
      ],
    });
  });

  it('leaves plain types untouched', () => {
    expect(toJsonTypes({ k: 'literal', value: 'text' })).toEqual({
      k: 'literal',
      value: 'text',
    });
  });

  it('unwraps a union left with a single surviving arm', () => {
    expect(
      toJsonTypes({
        k: 'union',
        members: [{ k: 'array', items: { k: 'string' } }],
      }),
    ).toEqual({ k: 'array', items: { k: 'string' } });
  });

  it('passes a cycle back-reference through unchanged', () => {
    expect(toJsonTypes({ k: 'cycle', name: 'OptionNode' })).toEqual({
      k: 'cycle',
      name: 'OptionNode',
    });
  });

  it('keeps the name of a declared object so a cycle can still resolve to it', () => {
    expect(
      toJsonTypes({
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
      }),
    ).toEqual({
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
      index: undefined,
    });
  });

  it('recurses into an index signature that is JSON-representable', () => {
    expect(
      toJsonTypes({
        k: 'object',
        properties: [],
        index: { k: 'union', members: [{ k: 'string' }, { k: 'function' }] },
      }),
    ).toEqual({
      k: 'object',
      properties: [],
      index: { k: 'string' },
    });
  });

  it('drops an index signature that projects to nothing', () => {
    expect(
      toJsonTypes({
        k: 'object',
        properties: [],
        index: { k: 'function' },
      }),
    ).toEqual({
      k: 'object',
      properties: [],
      index: undefined,
    });
  });

  it('leaves index absent when the object has no index signature', () => {
    expect(
      toJsonTypes({
        k: 'object',
        properties: [{ name: 'a', optional: false, type: { k: 'string' } }],
      }),
    ).toEqual({
      k: 'object',
      properties: [{ name: 'a', optional: false, type: { k: 'string' } }],
      index: undefined,
    });
  });
});
