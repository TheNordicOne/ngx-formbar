import { computed, inject, Signal } from '@angular/core';
import { Expression, FormContext } from '../types/expression.type';
import { ExpressionService } from '../services/expression.service';
import { resolveExpression } from './resolve-expression';

/**
 * Resolves the hidden state
 *
 * The hidden state does not inherit from its parent
 * @param option Signal containing the hidden expression option
 * @param formContext Signal providing the current form context for expression evaluation
 * @returns Computed signal that resolves to a boolean hidden state
 */
export function resolveHiddenState(
  option: Signal<Expression<boolean> | boolean | undefined>,
  formContext: Signal<FormContext>,
) {
  const expressionService = inject(ExpressionService);

  const expressionResult = resolveExpression<boolean>(
    option,
    formContext,
    expressionService,
  );

  return computed<boolean>(() => expressionResult() ?? false);
}
