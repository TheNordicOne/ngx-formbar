import { computed, effect, inject, Signal } from '@angular/core';
import {
  Expression,
  ExpressionService,
  FormContext,
  NgxFbAbstractControl,
  resolveExpression,
} from '@ngx-formbar/core';
import { FormService } from '../services/form.service';
import { AbstractControl } from '@angular/forms';

/**
 * Resolves the computedValue expression from a control's configuration
 *
 * @param content Signal containing control configuration with computedValue property
 * @returns Computed signal that resolves to the evaluated computed value or undefined
 */
export function withComputedValue<T>(content: Signal<NgxFbAbstractControl>) {
  const formService = inject(FormService);
  const expressionService = inject(ExpressionService);

  const formContext = computed<FormContext>(() => formService.formValue());

  return resolveExpression<T>(
    computed(() => content().computedValue as Expression<T> | T | undefined),
    formContext,
    expressionService,
  );
}

/**
 * Creates an effect that applies computed values to a form control
 *
 * Only applies when a `computedValue` is defined in the control's configuration.
 * Controls without `computedValue` are never touched by this effect.
 *
 * @param options.controlInstance Signal containing the AbstractControl to update
 * @param options.computeValueSignal Signal containing the resolved computed value
 * @param options.isComputedValueDefined Signal indicating whether computedValue is configured
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

    control.setValue(value);
  });
}
