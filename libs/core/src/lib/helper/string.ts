export function toSafeString(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  switch (typeof value) {
    case 'undefined':
      return 'undefined';
    case 'string':
      return value;
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
    case 'symbol':
    case 'bigint':
    case 'function':
      return value.toString();
    default:
      return JSON.stringify(value);
  }
}
