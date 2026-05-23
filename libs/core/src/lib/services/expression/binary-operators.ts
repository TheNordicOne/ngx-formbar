import type { BinaryOperator } from '../../parser';
import { isNumber, isObjectLike, isString } from './value-guards';

type NumericBinaryOperator =
  | '-'
  | '*'
  | '/'
  | '%'
  | '**'
  | '|'
  | '&'
  | '^'
  | '<<'
  | '>>'
  | '>>>';

type OrderedComparisonOperator = '<' | '>' | '<=' | '>=';

type EqualityOperator = '==' | '!=' | '===' | '!==';

export function isOrderedComparisonOperator(
  operator: BinaryOperator,
): operator is OrderedComparisonOperator {
  return (
    operator === '<' ||
    operator === '>' ||
    operator === '<=' ||
    operator === '>='
  );
}

export function isEqualityOperator(
  operator: BinaryOperator,
): operator is EqualityOperator {
  return (
    operator === '==' ||
    operator === '!=' ||
    operator === '===' ||
    operator === '!=='
  );
}

export function executeNumericBinaryOp(
  operator: NumericBinaryOperator,
  left: unknown,
  right: unknown,
): number {
  if (!isNumber(left) || !isNumber(right)) {
    throw new TypeError(`${operator} operator requires numbers`);
  }
  switch (operator) {
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      if (right === 0) {
        throw new Error('Division by zero');
      }
      return left / right;
    case '%':
      if (right === 0) {
        throw new Error('Modulo by zero');
      }
      return left % right;
    case '**':
      return left ** right;
    case '|':
      return left | right;
    case '&':
      return left & right;
    case '^':
      return left ^ right;
    case '<<':
      return left << right;
    case '>>':
      return left >> right;
    case '>>>':
      return left >>> right;
  }
}

export function executeOrderedComparison(
  operator: OrderedComparisonOperator,
  left: unknown,
  right: unknown,
): boolean {
  if (isNumber(left) && isNumber(right)) {
    return compareOrdered(operator, left, right);
  }
  if (isString(left) && isString(right)) {
    return compareOrdered(operator, left, right);
  }
  throw new TypeError(
    `${operator} operator requires operands of the same type (numbers or strings)`,
  );
}

function compareOrdered<T extends number | string>(
  operator: OrderedComparisonOperator,
  left: T,
  right: T,
) {
  switch (operator) {
    case '<':
      return left < right;
    case '>':
      return left > right;
    case '<=':
      return left <= right;
    case '>=':
      return left >= right;
  }
}

// `==`/`!=` are intentionally strict here. Loose-equality coercion is the
// most common JS footgun and this DSL rejects it.
export function executeEquality(
  operator: EqualityOperator,
  left: unknown,
  right: unknown,
): boolean {
  return operator === '==' || operator === '==='
    ? left === right
    : left !== right;
}

export function executeAddition(
  left: unknown,
  right: unknown,
): number | string {
  if (isNumber(left) && isNumber(right)) {
    return left + right;
  }
  if (isString(left) || isString(right)) {
    return String(left) + String(right);
  }
  throw new TypeError('+ operator requires numbers or strings');
}

export function executeIn(left: unknown, right: unknown): boolean {
  if (!isObjectLike(right)) {
    throw new TypeError('Right operand must be an object for "in" operator');
  }
  if (!isString(left)) {
    throw new TypeError(
      'Left operand must be of type string for "in" operator',
    );
  }
  // hasOwn semantics so the `in` operator does not walk the prototype chain.
  // Matches identifier and member-access scoping across the rest of the
  // language.
  return Object.prototype.hasOwnProperty.call(right, left);
}
