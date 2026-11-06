export function toSafeString(value: unknown): string {
  // Objects take the first branch, so String() never sees one.
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}
