import { computed, effect, inject, Signal } from '@angular/core';
import { NgxFbAbstractControl } from '../types/content.type';
import { FormService } from '../services/form.service';
import { ExpressionService } from '../services/expression.service';
import { Program } from 'acorn';
import { AbstractControl, ControlContainer } from '@angular/forms';
import { FormContext } from '../types/expression.type';

export function withComputedValue<T>(content: Signal<NgxFbAbstractControl>) {
  const formService = inject(FormService);
  const expressionService = inject(ExpressionService);
  const parentContainer = inject(ControlContainer);

  const computedValueAst = computed<Program | null>(() => {
    const computedValueOption = content().computedValue;
    if (typeof computedValueOption !== 'string') {
      return null;
    }
    return expressionService.parseExpressionToAst(computedValueOption);
  });

  const computedValueFunction = computed(() => {
    const computedValueOption = content().computedValue;
    if (typeof computedValueOption !== 'function') {
      return null;
    }
    return computedValueOption;
  });

  return computed<T | undefined>(() => {
    const value =
      formService.formValue() ?? (parentContainer.value as FormContext);

    const computedValueFn = computedValueFunction();
    if (computedValueFn) {
      return computedValueFn(value) as T;
    }

    const ast = computedValueAst();
    if (!ast) {
      return undefined;
    }

    return expressionService.evaluateExpression(ast, value) as T;
  });
}

export function setComputedValueEffect<T>(options: {
  controlInstance: Signal<AbstractControl>;
  computeValueSignal: Signal<T>;
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
