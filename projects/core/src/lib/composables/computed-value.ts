import { computed, effect, inject, Signal } from '@angular/core';
import { NgxFwContent } from '../types/content.type';
import { FormService } from '../services/form.service';
import { ExpressionService } from '../services/expression.service';
import { Program } from 'acorn';
import { AbstractControl, ControlContainer } from '@angular/forms';
import { FormContext } from '../types/expression.type';

export function withComputedValue<T>(content: Signal<NgxFwContent>) {
  const formService = inject(FormService);
  const expressionService = inject(ExpressionService);

  const computedValueAst = computed<Program | null>(() => {
    const computedValueOption = content().computedValue;
    return expressionService.parseExpressionToAst(computedValueOption);
  });
  const parentContainer = inject(ControlContainer);

  return computed<T | undefined>(() => {
    const value =
      formService.formValue() ?? (parentContainer.value as FormContext);
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
