import { InjectionToken } from '@angular/core';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';

/**
 * Form-scoped stable identity for array rows. The numeric index of a row
 * shifts on insert/remove/reorder, so a path like `contacts.0.email` is not a
 * stable key for the last-value cache. This assigns each row control instance
 * a stable id (the control object survives reordering) and rewrites the
 * index segment of a path to that id, so cached values follow their row.
 */
export interface RowIdentity {
  /**
   * Rewrites a dotted control path so that any segment indexing into a
   * `FormArray` is replaced by that row's stable id. Non-array segments are
   * left untouched.
   */
  stablePath(root: AbstractControl | null, path: string): string;
}

export const ROW_IDENTITY = new InjectionToken<RowIdentity>('ngxfb-row-identity');

export function rowIdentityFactory(): RowIdentity {
  const ids = new WeakMap<AbstractControl, string>();
  let counter = 0;

  const idFor = (control: AbstractControl): string => {
    const existing = ids.get(control);
    if (existing) {
      return existing;
    }
    counter += 1;
    const id = `row${String(counter)}`;
    ids.set(control, id);
    return id;
  };

  return {
    stablePath(root: AbstractControl | null, path: string): string {
      if (!root) {
        return path;
      }
      const segments = path.split('.');
      const out: string[] = [];
      let current: AbstractControl | null = root;

      for (const segment of segments) {
        if (current instanceof FormArray) {
          const index = Number(segment);
          const rows: AbstractControl[] = current.controls;
          const row = index >= 0 && index < rows.length ? rows[index] : null;
          out.push(row ? idFor(row) : segment);
          current = row;
          continue;
        }
        out.push(segment);
        current =
          current instanceof FormGroup ? (current.get(segment) ?? null) : null;
      }
      return out.join('.');
    },
  };
}
