import { computed, inject, Signal } from '@angular/core';
import { NgxFbAbstractControl } from '../types/content.type';
import { Expression } from '../types/expression.type';
import { ExpressionService } from '../services/expression';
import { NGX_FW_FORM_VALUE } from '../tokens/form-value';
import { resolveExpression } from './resolve-expression';

/**
 * Resolves the `computedValue` expression from a control's configuration to a
 * signal of the evaluated value (or undefined when not configured).
 *
 * @param content Signal of the control's content config. The `computedValue`
 *   field may be a literal, an expression string, or an expression function.
 * @returns A signal that resolves to the evaluated value, or `undefined` when
 *   the control declares no `computedValue`.
 */
export function withComputedValue<T>(content: Signal<NgxFbAbstractControl>) {
  const formValue = inject(NGX_FW_FORM_VALUE);
  const expressionService = inject(ExpressionService);

  return resolveExpression<T>(
    computed(() => content().computedValue as Expression<T> | T | undefined),
    formValue,
    expressionService,
  );
}
