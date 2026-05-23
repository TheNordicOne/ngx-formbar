import { computed, Signal } from '@angular/core';
import { Program } from '../parser';
import { Expression, FormContext } from '../types/expression.type';
import { ExpressionService } from '../services/expression';

function isExpressionFn<T>(
  value: Expression<T> | T,
): value is (formValue: FormContext) => T {
  return typeof value === 'function';
}

/**
 * Resolves an expression option into a computed signal value.
 *
 * String expressions are parsed and evaluated against the form context.
 * Functions are called with the form context. Static values pass through.
 * The parsed AST is cached so it is only recomputed when the option changes.
 *
 * @param option Signal carrying the configured value. May be a string
 *   expression, a predicate function, a literal value, or `undefined`.
 * @param formContext Signal exposing the current form value used as the
 *   evaluation context for string and function expressions.
 * @param expressionService Service used to parse and evaluate string
 *   expressions through its cached AST.
 * @returns Computed signal that re-evaluates whenever `option` or
 *   `formContext` changes. Resolves to the evaluated value, or `undefined`
 *   when the option is unset or the expression yields no result.
 */
export function resolveExpression<T>(
  option: Signal<Expression<T> | T | undefined>,
  formContext: Signal<FormContext>,
  expressionService: ExpressionService,
): Signal<T | null | undefined> {
  const ast = computed<Program | null>(() => {
    const expression = option();
    if (typeof expression !== 'string') {
      return null;
    }
    return expressionService.parseExpressionToAst(expression);
  });

  return computed(() => {
    const value = option();

    if (value === undefined) {
      return undefined;
    }

    if (isExpressionFn<T>(value)) {
      return value(formContext());
    }

    // Static values (boolean, number, etc.) pass through unchanged.
    if (typeof value !== 'string') {
      return value;
    }

    const parsedAst = ast();
    if (!parsedAst) {
      return undefined;
    }
    return expressionService.evaluateExpression<T>(parsedAst, formContext());
  });
}
