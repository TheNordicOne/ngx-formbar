import { computed, InjectionToken, Signal, signal } from '@angular/core';

/**
 * Scoped state that survives a control's destroy/create cycle.
 *
 * Provided by the structural directive (`NgxfbAbstractControlDirective`)
 * at the element level — each control gets its own instance.
 *
 * The control/group directive writes its value here on destroy.
 * On re-creation, the new control directive reads the saved value
 * and applies the appropriate value strategy.
 */
export interface ControlLifecycleState {
  readonly savedValue: Signal<unknown>;
  readonly hasSavedValue: Signal<boolean>;
  saveValue(value: unknown): void;
}

export const CONTROL_LIFECYCLE_STATE =
  new InjectionToken<ControlLifecycleState>('control-lifecycle-state');

const NO_SAVED_VALUE = Symbol('no-saved-value');

export function controlLifecycleStateFactory(): ControlLifecycleState {
  const savedValue = signal<unknown>(NO_SAVED_VALUE);

  return {
    savedValue: computed(() => {
      const value = savedValue();
      return value === NO_SAVED_VALUE ? undefined : value;
    }),
    hasSavedValue: computed(() => savedValue() !== NO_SAVED_VALUE),
    saveValue(value: unknown): void {
      savedValue.set(value);
    },
  };
}
