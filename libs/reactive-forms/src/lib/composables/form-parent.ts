import { inject } from '@angular/core';
import { ControlContainer, FormGroup } from '@angular/forms';

/**
 * Provides access to the enclosing reactive form group via the directive's
 * injected `ControlContainer`. Exposes the parent `FormGroup` as a live
 * getter and a helper to build the dotted path of a child control.
 */
export function withFormParent() {
  const parentContainer = inject(ControlContainer);

  return {
    get formGroup(): FormGroup | null {
      return parentContainer.control as FormGroup | null;
    },
    pathTo(name: string): string {
      return [...(parentContainer.path ?? []), name].join('.');
    },
  };
}
