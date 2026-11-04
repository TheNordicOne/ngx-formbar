import { toSafeString } from './string';

describe('toSafeString', () => {
  function named() {
    return 1;
  }

  it.each([
    [null, 'null'],
    [undefined, 'undefined'],
    ['a', 'a'],
    ['', ''],
    [true, 'true'],
    [false, 'false'],
    [1, '1'],
    [BigInt(2), '2'],
    [Symbol('s'), 'Symbol(s)'],
    [named, named.toString()],
    [{ a: 1 }, '{"a":1}'],
    [[1], '[1]'],
  ])('turns %s into %j', (value, text) => {
    expect(toSafeString(value)).toBe(text);
  });
});
