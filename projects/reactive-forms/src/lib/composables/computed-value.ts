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
