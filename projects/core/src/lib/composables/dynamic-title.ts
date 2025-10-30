import { computed, inject, Signal } from '@angular/core';
import { FormService } from '../services/form.service';
import { ExpressionService } from '../services/expression.service';
import { Program } from 'acorn';
import { FormContext } from '../types/expression.type';
import { NgxFbFormGroup } from '../types/content.type';

/**
 * Computes a dynamic title for a form control based on expression evaluation
 *
 * @param content Signal containing control configuration with dynamicTitle property
 * @returns Computed signal that resolves to the evaluated dynamic title string or undefined
 */
export function withDynamicTitle(content: Signal<NgxFbFormGroup>) {
  const formService = inject(FormService);
  const expressionService = inject(ExpressionService);

  const dynamicTitleAst = computed<Program | null>(() => {
    const dynamicTitleOption = content().dynamicTitle;
    if (typeof dynamicTitleOption !== 'string') {
      return null;
    }
    return expressionService.parseExpressionToAst(dynamicTitleOption);
  });

  const dynamicTitleFunction = computed(() => {
    const dynamicTitleOption = content().dynamicTitle;
    if (typeof dynamicTitleOption !== 'function') {
      return null;
    }
    return dynamicTitleOption;
  });

  return computed<string | undefined>(() => {
    const reactiveFormValues = formService.formValue();
    const currentSynchronousFormValues = formService.formGroup
      .value as FormContext;
    const evaluationContext =
      reactiveFormValues ?? currentSynchronousFormValues;

    const dynamicTitleFn = dynamicTitleFunction();

    if (dynamicTitleFn) {
      return dynamicTitleFn(evaluationContext);
    }

    const ast = dynamicTitleAst();
    if (!ast) {
      return undefined;
    }

    const title = expressionService.evaluateExpression(ast, evaluationContext);
    return title as string | undefined;
  });
}
