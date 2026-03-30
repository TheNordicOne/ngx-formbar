import { computed, Signal } from '@angular/core';
import { Expression, FormContext } from '../types/expression.type';
import { ExpressionService } from '../services/expression.service';
import { resolveExpression } from './resolve-expression';

/**
 * Resolves the hidden state with parent combination logic
 *
 * The hidden state differs from disabled/readonly inheritance:
 * 1. If the option is undefined, inherit the parent hidden state
 * 2. If the option is a function expression, use only the resolved value
 * 3. If the option is a string expression, OR with the parent hidden state
 *    (a child is hidden if either its own condition or its parent is hidden)
 *
 * @param option Signal containing the hidden expression option
 * @param formContext Signal providing the current form context for expression evaluation
 * @param expressionService Service used to parse and evaluate string expressions
 * @param parentHiddenState Signal providing the parent group's hidden state
 * @returns Computed signal that resolves to a boolean hidden state
 */
export function resolveHiddenState(
  option: Signal<Expression<boolean> | boolean | undefined>,
  formContext: Signal<FormContext>,
  expressionService: ExpressionService,
  parentHiddenState: Signal<boolean>,
) {
  const resolved = resolveExpression<boolean>(
    option,
    formContext,
    expressionService,
  );

  return computed<boolean>(() => {
    const hiddenOption = option();

    if (hiddenOption === undefined) {
      return parentHiddenState();
    }

    const isHidden = resolved() ?? false;

    if (typeof hiddenOption === 'function') {
      return isHidden;
    }

    return isHidden || parentHiddenState();
  });
}
