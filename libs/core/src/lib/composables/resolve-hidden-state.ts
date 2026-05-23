import { computed, inject, Signal } from '@angular/core';
import { Expression, FormContext } from '../types/expression.type';
import { ExpressionService } from '../services/expression';
import { resolveExpression } from './resolve-expression';

/**
 * Resolves the hidden state for an element.
 *
 * Hidden when the parent group is hidden or when the expression evaluates to true.
 * An undefined option resolves to false rather than inheriting the parent state.
 *
 * @param option Signal carrying the configured `hidden` value (boolean,
 *   string expression, predicate function, or `undefined`).
 * @param formContext Signal exposing the current form value used to evaluate
 *   string and function expressions.
 * @param parentGroupIsHidden Signal reporting the resolved hidden state of the
 *   enclosing group. A hidden parent forces the child to hidden regardless of
 *   the local expression.
 * @returns Computed signal that resolves to the effective hidden state.
 */
export function resolveHiddenState(
  option: Signal<Expression<boolean> | boolean | undefined>,
  formContext: Signal<FormContext>,
  parentGroupIsHidden: Signal<boolean>,
) {
  const expressionService = inject(ExpressionService);

  const expressionResult = resolveExpression<boolean>(
    option,
    formContext,
    expressionService,
  );

  return computed<boolean>(
    () => parentGroupIsHidden() || (expressionResult() ?? false),
  );
}
