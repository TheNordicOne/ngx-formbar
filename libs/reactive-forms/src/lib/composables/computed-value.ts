import { computed, effect, inject, Signal, untracked } from '@angular/core';
import {
  Expression,
  ExpressionService,
  NgxFbAbstractControl,
  resolveExpression,
} from '@ngx-formbar/core';
import { FormService } from '../services/form.service';

/**
 * Resolves the computedValue expression from a control's configuration
 *
 * @param content Signal containing control configuration with computedValue property
 * @returns Computed signal that resolves to the evaluated computed value or undefined
 */
export function withComputedValue<T>(content: Signal<NgxFbAbstractControl>) {
  const formService = inject(FormService);
  const expressionService = inject(ExpressionService);

  return resolveExpression<T>(
    computed(() => content().computedValue as Expression<T> | T | undefined),
    formService.formValue,
    expressionService,
  );
}

/**
 * Creates an effect that applies computed values to a form control.
 *
 * Only applies when a `computedValue` is defined in the control's configuration.
 * Controls without `computedValue` are never touched by this effect.
 *
 * @param options.setValueFunction Function called with the resolved value; the caller decides how to apply it (e.g. `formControl?.setValue(value, { emitEvent: false })`). Invoked lazily so the form control reference can be looked up at apply time rather than captured eagerly.
 * @param options.computeValueSignal Signal containing the resolved computed value
 * @param options.isComputedValueDefined Signal indicating whether computedValue is configured
 * @param options.formResetSignal Signal that fires on form reset, retriggering the effect
 */
export function setComputedValueEffect(options: {
  setValueFunction: (value: unknown) => void;
  computeValueSignal: Signal<unknown>;
  isComputedValueDefined: Signal<boolean>;
  formResetSignal: Signal<unknown>;
}) {
  effect(() => {
    const value = options.computeValueSignal();
    options.formResetSignal();

    if (!options.isComputedValueDefined()) {
      return;
    }

    untracked(() => {
      options.setValueFunction(value);
    });
  });
}
