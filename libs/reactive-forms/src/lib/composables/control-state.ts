import { computed, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  PristineChangeEvent,
  StatusChangeEvent,
  ValidationErrors,
} from '@angular/forms';
import { filter, map, startWith, switchMap } from 'rxjs';

export interface ControlState {
  errors: Signal<ValidationErrors | null>;
  isDirty: Signal<boolean>;
}

/**
 * Exposes validation errors and dirty state of an AbstractControl as separate
 * signals over one shared subscription. Re-subscribes when `controlInstance`
 * emits a new control reference (e.g. validators or `updateOn` changed and
 * the FormControl was rebuilt), so the signals always reflect the currently
 * attached instance.
 *
 * @param controlInstance Signal of the `AbstractControl` to observe. When the
 *   signal emits a new reference, the inner subscription is swapped to the
 *   new control via `switchMap`.
 * @returns An object with `errors` (signal of `ValidationErrors | null`) and
 *   `isDirty` (signal of `boolean`). Both share one underlying subscription.
 */
export function withControlState(
  controlInstance: Signal<AbstractControl>,
): ControlState {
  const snapshot = (control: AbstractControl) => ({
    errors: control.errors,
    isDirty: control.dirty,
  });

  const state = toSignal(
    toObservable(controlInstance).pipe(
      switchMap((control) =>
        control.events.pipe(
          filter(
            (event) =>
              event instanceof StatusChangeEvent ||
              event instanceof PristineChangeEvent,
          ),
          map(() => snapshot(control)),
          startWith(snapshot(control)),
        ),
      ),
    ),
    { initialValue: { errors: null, isDirty: false } },
  );

  return {
    errors: computed(() => state().errors),
    isDirty: computed(() => state().isDirty),
  };
}
