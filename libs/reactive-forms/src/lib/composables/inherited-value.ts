import { computed, Signal } from '@angular/core';

/**
 * Resolves a field from the directive's own config, falling back to the
 * same field on the enclosing parent group when the own value is undefined.
 *
 * @param controlConfig Signal of the directive's inner config.
 * @param key Field on `controlConfig` to read.
 * @param parentSignal Parent group's signal accessor for the same field, or undefined when there is no parent group.
 */
export function withInheritedValue<T, K extends keyof T>(
  controlConfig: Signal<T>,
  key: K,
  parentSignal: Signal<T[K]> | undefined,
): Signal<T[K]> {
  return computed(() => {
    const own = controlConfig()[key];
    if (own !== undefined) {
      return own;
    }
    return parentSignal ? parentSignal() : (undefined as T[K]);
  });
}
