import { effect, Signal, untracked } from '@angular/core';
import { AbstractControl } from '@angular/forms';

/**
 * Creates an effect that writes the computed value to the form control. Only
 * runs when the control's configuration defines `computedValue`. Controls
 * without `computedValue` are never touched, so user input on them is
 * preserved.
 *
 * @param options.controlInstance Signal resolving to the `AbstractControl`
 *   that should receive the computed value via `setValue`.
 * @param options.computeValueSignal Signal of the resolved computed value to
 *   write into the control.
 * @param options.isComputedValueDefined Signal indicating whether the
 *   control's config declares `computedValue`. When `false`, the effect
 *   returns without writing.
 * @param options.formResetSignal Signal that fires on form reset; tracking it
 *   forces the effect to re-run so the computed value is re-applied after
 *   the underlying control is reset.
 */
export function setComputedValueEffect(options: {
  controlInstance: Signal<AbstractControl>;
  computeValueSignal: Signal<unknown>;
  isComputedValueDefined: Signal<boolean>;
  formResetSignal: Signal<unknown>;
}) {
  effect(() => {
    const control = options.controlInstance();
    const value = options.computeValueSignal();
    options.formResetSignal();

    if (!options.isComputedValueDefined()) {
      return;
    }

    untracked(() => {
      control.setValue(value);
    });
  });
}
