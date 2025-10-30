import { computed, inject, Signal } from '@angular/core';
import { NgxFbControl } from '../types/content.type';
import { FormService } from '../services/form.service';
import { ExpressionService } from '../services/expression.service';
import { Program } from 'acorn';
import { FormContext } from '../types/expression.type';

/**
 * Computes a dynamic label for a form control based on expression evaluation
 *
 * @param content Signal containing control configuration with dynamicLabel property
 * @returns Computed signal that resolves to the evaluated dynamic label string or undefined
 */
export function withDynamicLabel(content: Signal<NgxFbControl>) {
  const formService = inject(FormService);
  const expressionService = inject(ExpressionService);

  const dynamicLabelAst = computed<Program | null>(() => {
    const dynamicLabelOption = content().dynamicLabel;
    if (typeof dynamicLabelOption !== 'string') {
      return null;
    }
    return expressionService.parseExpressionToAst(dynamicLabelOption);
  });

  const dynamicLabelFunction = computed(() => {
    const dynamicLabelOption = content().dynamicLabel;
    if (typeof dynamicLabelOption !== 'function') {
      return null;
    }
    return dynamicLabelOption;
  });

  return computed<string | undefined>(() => {
    const reactiveFormValues = formService.formValue();
    const currentSynchronousFormValues = formService.formGroup
      .value as FormContext;
    const evaluationContext =
      reactiveFormValues ?? currentSynchronousFormValues;

    const dynamicLabelFn = dynamicLabelFunction();

    if (dynamicLabelFn) {
      return dynamicLabelFn(evaluationContext);
    }

    const ast = dynamicLabelAst();

    if (!ast) {
      return undefined;
    }
    const label = expressionService.evaluateExpression(ast, evaluationContext);
    return label as string | undefined;
  });
}
