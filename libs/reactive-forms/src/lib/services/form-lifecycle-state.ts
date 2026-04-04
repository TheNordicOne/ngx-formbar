import { computed, InjectionToken, Signal, signal } from '@angular/core';

/**
 * Form-level cache of control values that persists across destroy/create cycles.
 *
 * Provided once at the form component level. Controls save their values
 * here on destroy (keyed by their full form path). On re-creation,
 * controls read their saved values to apply the appropriate value strategy.
 */
export interface FormLifecycleState {
  hasSavedValue(path: string): Signal<boolean>;
  getSavedValue(path: string): Signal<unknown>;
  saveValue(path: string, value: unknown): void;
  clear(): void;
}

export const FORM_LIFECYCLE_STATE = new InjectionToken<FormLifecycleState>(
  'form-lifecycle-state',
);

const NO_SAVED_VALUE = Symbol('no-saved-value');

export function formLifecycleStateFactory(): FormLifecycleState {
  const entries = signal<Record<string, unknown>>({});

  return {
    hasSavedValue(path: string): Signal<boolean> {
      return computed(() => path in entries());
    },
    getSavedValue(path: string): Signal<unknown> {
      return computed(() => {
        const value = entries()[path];
        return value === NO_SAVED_VALUE ? undefined : value;
      });
    },
    saveValue(path: string, value: unknown): void {
      entries.update((e) => ({ ...e, [path]: value }));
    },
    clear(): void {
      entries.set({});
    },
  };
}
