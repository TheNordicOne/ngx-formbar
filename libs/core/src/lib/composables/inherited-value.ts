import { computed, Signal } from '@angular/core';

/**
 * Reads a field from the directive's own config and falls back to the parent
 * group's signal for the same field when the own value is undefined.
 *
 * @param controlConfig Signal of the directive's inner content config.
 * @param key Field on the config to read.
 * @param parentSignal Parent group's signal accessor for the same field, or
 *   `undefined` when there is no enclosing group. When the own value is
 *   `undefined` and no parent signal is supplied, the result is `undefined`.
 * @returns A signal that resolves to the own value when defined, else the
 *   parent's value.
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
