import { effect, Signal, untracked } from '@angular/core';
import { AbstractControl } from '@angular/forms';

/**
 * Creates an effect that toggles the form instance's enabled/disabled state.
 * When `handleDisable` is true, calls `enable()` or `disable()` on the
 * resolved instance with `emitEvent: false`. When false, the effect is a
 * no-op and the component applies the state itself.
 *
 * @param options.disabledSignal Signal of the resolved disabled state.
 * @param options.handleDisableSignal Signal indicating whether the library
 *   should apply the state. Mirrors the registration's `disabledHandling`.
 * @param options.instance Signal of the `FormControl` or `FormGroup` to
 *   toggle. Read inside `untracked` so re-creating the instance does not
 *   re-run the effect on its own.
 */
export function disabledEffect(options: {
  disabledSignal: Signal<boolean>;
  handleDisableSignal: Signal<boolean>;
  instance: Signal<AbstractControl>;
}): void {
  effect(() => {
    const disabled = options.disabledSignal();
    const handleDisable = options.handleDisableSignal();

    if (!handleDisable) {
      return;
    }

    untracked(() => {
      const control = options.instance();
      if (disabled) {
        control.disable({ emitEvent: false });
        return;
      }
      control.enable({ emitEvent: false });
    });
  });
}
