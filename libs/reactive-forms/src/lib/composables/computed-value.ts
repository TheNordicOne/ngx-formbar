import { computed, effect, inject, Signal, untracked } from '@angular/core';
import {
  Expression,
  ExpressionService,
  NgxFbAbstractControl,
  resolveExpression,
} from '@ngx-formbar/core';
import { AbstractControl } from '@angular/forms';
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
 * @param options.controlInstance Signal resolving to the AbstractControl receiving the computed value
 * @param options.computeValueSignal Signal containing the resolved computed value
 * @param options.isComputedValueDefined Signal indicating whether computedValue is configured
 * @param options.formResetSignal Signal that fires on form reset, retriggering the effect
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
