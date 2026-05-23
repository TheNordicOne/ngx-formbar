export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// True for plain objects AND arrays. Both call sites — the `in` operator
// right operand and the object-spread source — want array values to pass.
export function isObjectLike(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}
