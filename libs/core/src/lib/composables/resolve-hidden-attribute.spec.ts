import { signal } from '@angular/core';
import { resolveHiddenAttribute } from './resolve-hidden-attribute';

describe('resolveHiddenAttribute', () => {
  it.each([
    [true, true, true],
    [true, false, null],
    [false, true, null],
    [false, false, null],
  ])(
    'with handleVisibility %s and hidden %s gives %s',
    (handle, hidden, result) => {
      expect(
        resolveHiddenAttribute({
          handleVisibility: signal(handle),
          hiddenSignal: signal(hidden),
        })(),
      ).toBe(result);
    },
  );
});
