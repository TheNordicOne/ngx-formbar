import { Signal } from '@angular/core';
import { SignalInput } from '@ngx-formbar/core';

type UnwrapSignalInput<T> = T extends SignalInput<infer V> ? V : never;

/**
 * Shape constraint for {@link toSignalMap}: every key must come from the
 * interface `T`, and every value must be a `Signal<V>` where `V` is the
 * unwrapped value type of the interface's `SignalInput<V>` for that key.
 */
export type SignalMapFor<T> = {
  [K in keyof T]?: Signal<UnwrapSignalInput<NonNullable<T[K]>>>;
};

/**
 * Builds the `Map<string, Signal<unknown>>` consumed by `createBindings`
 * from a type-checked record keyed by a directive interface.
 *
 * Anchoring the record to the interface forces every entry to use a key
 * that exists on the interface and supply a `Signal` whose value type
 * matches the interface's `SignalInput`. Stray keys, typos, and stale
 * entries fail to compile.
 */
export function toSignalMap<T extends object>(
  record: SignalMapFor<T>,
): Map<string, Signal<unknown>> {
  return new Map(
    Object.entries(record).filter(([, v]) => v !== undefined) as [
      string,
      Signal<unknown>,
    ][],
  );
}
