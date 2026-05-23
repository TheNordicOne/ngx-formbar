import { isNumber, isString } from './value-guards';

export function requireNumbers(
  operator: string,
  left: unknown,
  right: unknown,
): [number, number] {
  if (!isNumber(left) || !isNumber(right)) {
    throw new TypeError(`${operator} operator requires numbers`);
  }
  return [left, right];
}

export function requireSameOrderedType(
  operator: string,
  left: unknown,
  right: unknown,
): [number, number] | [string, string] {
  if (isNumber(left) && isNumber(right)) {
    return [left, right];
  }
  if (isString(left) && isString(right)) {
    return [left, right];
  }
  throw new TypeError(
    `${operator} operator requires operands of the same type (numbers or strings)`,
  );
}
