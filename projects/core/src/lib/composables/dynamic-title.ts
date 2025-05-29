import { computed, inject, Signal } from '@angular/core';
import { NgxFwFormGroup } from '../types/content.type';
import { FormService } from '../services/form.service';
import { ExpressionService } from '../services/expression.service';
import { Program } from 'acorn';

/**
 * Computes a dynamic title for a form control based on expression evaluation
 *
 * @param content Signal containing control configuration with dynamicTitle property
 * @returns Computed signal that resolves to the evaluated dynamic title string or undefined
 */
export function withDynamicTitle(content: Signal<NgxFwFormGroup>) {
  const formService = inject(FormService);
  const expressionService = inject(ExpressionService);

  const dynamicTitleAst = computed<Program | null>(() => {
    const readonlyOption = content().dynamicTitle;
    return expressionService.parseExpressionToAst(readonlyOption);
  });

  return computed<string | undefined>(() => {
    const value = formService.formValue();
    const ast = dynamicTitleAst();
    if (!ast) {
      return undefined;
    }

    const title = expressionService.evaluateExpression(ast, value);
    return title as string | undefined;
  });
}
