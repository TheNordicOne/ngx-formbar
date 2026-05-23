import { computed, Signal } from '@angular/core';
import { Expression, FormContext } from '../types/expression.type';
import { ExpressionService } from '../services/expression';
import { resolveExpression } from './resolve-expression';

/**
 * Resolves a boolean expression that inherits from a parent state when undefined.
 *
 * Used for states like disabled and readonly. If the option is undefined,
 * the parent state is returned. Otherwise the expression is resolved and
 * defaults to false.
 *
 * @param option Signal carrying the configured value (boolean, string
 *   expression, predicate function, or `undefined`).
 * @param formContext Signal exposing the current form value used to evaluate
 *   string and function expressions.
 * @param expressionService Service used to parse and evaluate string
 *   expressions.
 * @param parentState Signal reporting the resolved state of the enclosing
 *   group. Inherited only when `option` is `undefined`; an explicit `false`
 *   blocks inheritance.
 * @returns Computed signal that resolves to the effective boolean state.
 */
export function resolveInheritableExpression(
  option: Signal<Expression<boolean> | boolean | undefined>,
  formContext: Signal<FormContext>,
  expressionService: ExpressionService,
  parentState: Signal<boolean>,
): Signal<boolean> {
  const resolved = resolveExpression<boolean>(
    option,
    formContext,
    expressionService,
  );

  return computed(() => {
    if (option() === undefined) {
      return parentState();
    }
    return resolved() ?? false;
  });
}
