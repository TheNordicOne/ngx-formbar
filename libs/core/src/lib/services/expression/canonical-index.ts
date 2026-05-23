const CANONICAL_INTEGER_STRING = /^(0|[1-9]\d*)$/;

// Canonical non-negative integer indices only. Mirrors JS string/array
// indexing: `"0"` and `0` work; `" 0 "`, `"0x1"`, `"1e0"`, `""` do not.
export function isCanonicalIndex(value: unknown): value is number | string {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 0;
  }
  if (typeof value === 'string') {
    return CANONICAL_INTEGER_STRING.test(value);
  }
  return false;
}

export function readIndexable(
  kind: 'array' | 'string',
  value: readonly unknown[] | string,
  property: string | number,
): unknown {
  if (property === 'length') {
    return value.length;
  }
  if (isCanonicalIndex(property)) {
    return value[Number(property)];
  }
  throw new Error(`Invalid property access on ${kind}: ${String(property)}`);
}
