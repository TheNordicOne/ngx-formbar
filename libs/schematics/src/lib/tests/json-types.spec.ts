import { describe, expect, it } from 'vitest';
import { toJsonTypes } from '../schema/json-types';

describe('toJsonTypes', () => {
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
