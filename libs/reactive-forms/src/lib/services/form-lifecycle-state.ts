import { computed, InjectionToken, Signal, signal } from '@angular/core';

/**
 * Form-level cache of control values keyed by full form path. Provided once
 * at the form component. Controls save values on destroy and read them back
 * on re-creation to apply their value strategy.
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

export function formLifecycleStateFactory(): FormLifecycleState {
  const entries = signal<Record<string, unknown>>({});

  return {
    hasSavedValue(path: string): Signal<boolean> {
      return computed(() => path in entries());
    },
    getSavedValue(path: string): Signal<unknown> {
      return computed(() => entries()[path]);
    },
    saveValue(path: string, value: unknown): void {
      entries.update((e) => ({ ...e, [path]: value }));
    },
    clear(): void {
      entries.set({});
    },
  };
}
