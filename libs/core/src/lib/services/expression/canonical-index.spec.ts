import { isCanonicalIndex } from './canonical-index';

describe('isCanonicalIndex', () => {
  it.each([0, 1, 10, '0', '1', '10', '19'])('accepts %j', (value) => {
    expect(isCanonicalIndex(value)).toBe(true);
  });

  it.each([
    -1,
    1.5,
    NaN,
    '',
    ' 0',
    '01',
    '1x',
    'x1',
    '-1',
    '1e0',
    null,
    true,
    {},
  ])('rejects %j', (value) => {
    expect(isCanonicalIndex(value)).toBe(false);
  });
});
