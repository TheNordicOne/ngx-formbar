import { AbstractControl } from '@angular/forms';

export function isEmpty(v: unknown): boolean {
  if (v === null) {
    return true;
  }
  if (v === undefined) {
    return true;
  }
  return v === '';
}

export function toNumber(v: unknown): number {
  if (typeof v === 'number') {
    return v;
  }
  return Number(v);
}

export function getByPath(
  ctrl: AbstractControl | null,
  path: string,
): AbstractControl | null {
  if (!ctrl) {
    return null;
  }
  const segments = path.split('.');
  let node: AbstractControl | null = ctrl.root as AbstractControl | null;
  for (const seg of segments) {
    if (!node) {
      return null;
    }
    node =
      typeof (node as unknown as { get(path: string): AbstractControl | null })
        .get === 'function'
        ? (
            node as unknown as { get(path: string): AbstractControl | null }
          ).get(seg)
        : null;
  }
  return node;
}
