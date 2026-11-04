import { readMethod } from './safe-methods';

describe('readMethod', () => {
  it('returns a function', () => {
    expect(readMethod(' a ', 'trim')?.call(' a ')).toBe('a');
  });

  it('returns nothing for another value', () => {
    expect(readMethod('a', 'length')).toBeUndefined();
  });
});
