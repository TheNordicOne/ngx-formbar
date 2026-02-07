import { computed, effect, inject, Signal } from '@angular/core';
import {
  Expression,
  ExpressionService,
  FormContext,
  NgxFbAbstractControl,
  resolveExpression,
} from '@ngx-formbar/core';
import { FormService } from '../services/form.service';
import { AbstractControl, ControlContainer } from '@angular/forms';

/**
 * Resolves the computedValue expression from a control's configuration
 *
 * @param content Signal containing control configuration with computedValue property
 * @returns Computed signal that resolves to the evaluated computed value or undefined
 */
export function withComputedValue<T>(content: Signal<NgxFbAbstractControl>) {
  const formService = inject(FormService);
  const expressionService = inject(ExpressionService);
  const parentContainer = inject(ControlContainer);

  const formContext = computed<FormContext>(
    () => formService.formValue() ?? (parentContainer.value as FormContext),
  );

  return resolveExpression<T>(
    computed(() => content().computedValue as Expression<T> | T | undefined),
    formContext,
    expressionService,
  );
}

/**
 * Creates an effect that applies computed values to a form control
 *
 * The effect only updates the control when the parent form is dirty or the computed value is truthy,
 * preventing unnecessary overwrites on pristine forms.
 *
 * @param options.controlInstance Signal containing the AbstractControl to update
 * @param options.computeValueSignal Signal containing the resolved computed value
 */
export function setComputedValueEffect(options: {
  controlInstance: Signal<AbstractControl>;
  computeValueSignal: Signal<unknown>;
}) {
  const parentContainer = inject(ControlContainer);
  effect(() => {
    const control = options.controlInstance();
    const value = options.computeValueSignal();

    if (!value && parentContainer.pristine) {
      return;
    }
    control.setValue(value);
  });
}
