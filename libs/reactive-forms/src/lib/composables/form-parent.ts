import { inject } from '@angular/core';
import { ControlContainer, FormGroup } from '@angular/forms';

/**
 * Provides access to the enclosing reactive form group via the injected
 * `ControlContainer`. Exposes the parent `FormGroup` as a live getter and a
 * helper to build the dotted path to a child control.
 *
 * @returns An object with `formGroup` (live getter for the parent
 *   `FormGroup`, or `null` when no group is available yet) and `pathTo(name)`
 *   (joins the container path with the given child name into a dotted path).
 */
export function withFormParent() {
  const parentContainer = inject(ControlContainer);

  return {
    get formGroup() {
      return parentContainer.control as FormGroup | null;
    },
    pathTo(name: string) {
      return [...(parentContainer.path ?? []), name].join('.');
    },
  };
}
