import { computed, Signal } from '@angular/core';
import { Program } from 'acorn';
import { Expression, FormContext } from '../types/expression.type';
import { ExpressionService } from '../services/expression.service';

function isExpressionFn<T>(
  value: Expression<T> | T,
): value is (formValue: FormContext) => T {
  return typeof value === 'function';
}

/**
 * Resolves an expression option into a computed signal value
 *
 * Handles three expression types:
 * - **string**: Parsed to AST and evaluated against the form context
 * - **function**: Called with the form context as argument
 * - **static value / undefined**: Returned as-is
 *
 * Internally caches the parsed AST in a separate computed signal
 * so it is only recalculated when the option itself changes.
 *
 * @param option Signal containing the expression option (string, function, static value, or undefined)
 * @param formContext Signal providing the current form context for expression evaluation
 * @param expressionService Service used to parse and evaluate string expressions
 * @returns Computed signal that resolves to the evaluated value or undefined
 */
export function resolveExpression<T>(
  option: Signal<Expression<T> | T | undefined>,
  formContext: Signal<FormContext>,
  expressionService: ExpressionService,
) {
  const ast = computed<Program | null>(() => {
    const expression = option();
    if (typeof expression !== 'string') {
      return null;
    }
    return expressionService.parseExpressionToAst(expression);
  });

  return computed<T | undefined>(() => {
    const value = option();

    if (value === undefined) {
      return undefined;
    }

    if (isExpressionFn<T>(value)) {
      return value(formContext());
    }

    // When it's not an expression passed as a string, return the value as is
    // e.g.: boolean, number
    if (typeof value !== 'string') {
      return value;
    }

    const parsedAst = ast();
    if (!parsedAst) {
      return undefined;
    }
    return expressionService.evaluateExpression(parsedAst, formContext()) as T;
  });
}
