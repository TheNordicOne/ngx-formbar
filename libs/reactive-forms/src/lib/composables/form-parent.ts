import { inject } from '@angular/core';
import { AbstractControl, ControlContainer } from '@angular/forms';

export interface FormParent {
  readonly control: AbstractControl | null;
  pathTo(name: string): string;
}

/**
 * Provides access to the enclosing reactive form container via the injected
 * `ControlContainer`. Exposes the raw parent control (a `FormGroup`, or a
 * `FormArray` for array rows) and a helper to build the dotted path to a
 * child control.
 *
 * @returns An object with `control` (live getter for the parent
 *   `AbstractControl`, or `null` when none is available yet) and `pathTo(name)`
 *   (joins the container path with the given child name into a dotted path).
 */
export function withFormParent(): FormParent {
  const parentContainer = inject(ControlContainer);

  return {
    get control(): AbstractControl | null {
      return parentContainer.control;
    },
    pathTo(name: string): string {
      return [...(parentContainer.path ?? []), name].join('.');
    },
  };
}
