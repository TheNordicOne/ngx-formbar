import { computed, Signal } from '@angular/core';
import { Expression, FormContext } from '../types/expression.type';
import { ExpressionService } from '../services/expression.service';
import { resolveExpression } from './resolve-expression';

/**
 * Resolves an inheritable boolean expression with parent state fallback
 *
 * Used for states like disabled and readonly that follow a common pattern:
 * 1. If the option is undefined, inherit the parent state
 * 2. Otherwise, resolve the expression and default to false
 *
 * @param option Signal containing the expression option (boolean, string expression, function, or undefined)
 * @param formContext Signal providing the current form context for expression evaluation
 * @param expressionService Service used to parse and evaluate string expressions
 * @param parentState Signal providing the parent group's state to inherit from
 * @returns Computed signal that resolves to a boolean state
 */
export function resolveInheritableExpression(
  option: Signal<Expression<boolean> | boolean | undefined>,
  formContext: Signal<FormContext>,
  expressionService: ExpressionService,
  parentState: Signal<boolean>,
) {
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
