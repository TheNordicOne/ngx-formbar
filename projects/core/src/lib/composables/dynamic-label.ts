import { computed, inject, Signal } from '@angular/core';
import { NgxFwControl } from '../types/content.type';
import { FormService } from '../services/form.service';
import { ExpressionService } from '../services/expression.service';
import { Program } from 'acorn';

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
    const value = formService.formValue();
    const ast = dynamicLabelAst();

    if (!ast) {
      return undefined;
    }
    const label = expressionService.evaluateExpression(ast, value);
    return label as string | undefined;
  });
}
