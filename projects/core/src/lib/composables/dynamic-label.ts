import { computed, inject, Signal } from '@angular/core';
import { NgxFwControl } from '../types/content.type';
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
export function withDynamicLabel(content: Signal<NgxFwControl>) {
  const formService = inject(FormService);
  const expressionService = inject(ExpressionService);

  const dynamicLabelAst = computed<Program | null>(() => {
    const readonlyOption = content().dynamicLabel;
    return expressionService.parseExpressionToAst(readonlyOption);
  });

  return computed<string | undefined>(() => {
    const reactiveFormValues = formService.formValue();
    const currentSynchronousFormValues = formService.formGroup
      .value as FormContext;
    const evaluationContext =
      reactiveFormValues ?? currentSynchronousFormValues;

    const ast = dynamicLabelAst();

    if (!ast) {
      return undefined;
    }
    const label = expressionService.evaluateExpression(ast, evaluationContext);
    return label as string | undefined;
  });
}
