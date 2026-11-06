import { TestBed } from '@angular/core/testing';
import { NGX_FW_COMPONENT_REGISTRATIONS } from './component-registrations';
import { NGX_FW_DEFAULT_UPDATE_STRATEGY } from './default-update-strategy';
import {
  NGX_FW_CONFIG,
  NGX_FW_CONFIG_RESOLVED,
  NGX_FW_DEFAULT_CONFIG,
} from './global-config';

function resolve(base: object, ...extras: object[]) {
  TestBed.configureTestingModule({
    providers: [
      { provide: NGX_FW_DEFAULT_CONFIG, useValue: base },
      ...extras.map((useValue) => ({
        provide: NGX_FW_CONFIG,
        useValue,
        multi: true,
      })),
    ],
  });
  return TestBed.inject(NGX_FW_CONFIG_RESOLVED);
}

describe('root token defaults', () => {
  it('starts from an empty configuration', () => {
    expect(TestBed.inject(NGX_FW_DEFAULT_CONFIG)).toEqual({});
    expect(TestBed.inject(NGX_FW_CONFIG)).toEqual([]);
    expect(TestBed.inject(NGX_FW_CONFIG_RESOLVED)).toEqual({});
  });

  it('starts without registrations', () => {
    expect(TestBed.inject(NGX_FW_COMPONENT_REGISTRATIONS)).toEqual(new Map());
  });

  it('updates on change by default', () => {
    expect(TestBed.inject(NGX_FW_DEFAULT_UPDATE_STRATEGY)).toBe('change');
  });
});

describe('NGX_FW_CONFIG_RESOLVED', () => {
  it('keeps the base when nothing overrides it', () => {
    expect(resolve({ a: 1 })).toEqual({ a: 1 });
  });

  it('applies the partials in order', () => {
    expect(resolve({ a: 1, b: 1 }, { a: 2 }, { a: 3, c: 3 })).toEqual({
      a: 3,
      b: 1,
      c: 3,
    });
  });

  it('merges nested objects', () => {
    expect(resolve({ a: { b: 1, c: 1 } }, { a: { c: 2, d: 2 } })).toEqual({
      a: { b: 1, c: 2, d: 2 },
    });
  });

  it.each([
    ['an array over an object', { a: { b: 1 } }, { a: [1] }, { a: [1] }],
    ['an object over an array', { a: [1] }, { a: { b: 1 } }, { a: { b: 1 } }],
    ['an array over an array', { a: [1] }, { a: [2] }, { a: [2] }],
    ['null over an object', { a: { b: 1 } }, { a: null }, { a: null }],
    ['an object over null', { a: null }, { a: { b: 1 } }, { a: { b: 1 } }],
    ['a value over an object', { a: { b: 1 } }, { a: 1 }, { a: 1 }],
    ['an object over a value', { a: 1 }, { a: { b: 1 } }, { a: { b: 1 } }],
  ])('replaces with %s', (_, base, partial, result) => {
    expect(resolve(base, partial)).toEqual(result);
  });

  it('leaves the base untouched', () => {
    const base = { a: 1, b: { c: 1 } };

    resolve(base, { a: 2, b: { c: 2 } });

    expect(base).toEqual({ a: 1, b: { c: 1 } });
  });
});
