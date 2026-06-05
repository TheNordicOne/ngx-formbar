import { computed, inject, Signal } from '@angular/core';
import { AbstractControl, FormArray } from '@angular/forms';
import { NGXFB_BIND_MODE } from '../tokens/bind-mode';
import { FormParent } from './form-parent';

export interface BindMode<C extends AbstractControl> {
  /** Whether this directive renders an array row (adopts instead of creates). */
  readonly bindMode: boolean;
  /**
   * The resolved instance: the adopted control from the parent in bind mode,
   * falling back to the freshly created one; the created one otherwise.
   */
  readonly instance: Signal<C>;
  /**
   * True when the directive sits directly in a `FormArray` (a row top). Row
   * tops never attach, detach, or run destroy cleanup, since the `FormArray`
   * owns their membership.
   */
  isRowTop(): boolean;
}

/**
 * Shared bind-mode seam for the row-rendering directives. In bind mode the
 * directive adopts the existing `AbstractControl` held by its parent (the row
 * built by {@link RowFactoryService}) instead of creating and self-registering
 * a new one. The same directive still creates its own instance when used
 * outside an array.
 *
 * @param options.parent The directive's resolved {@link FormParent}.
 * @param options.controlName Signal of the entry name (the row index, in bind
 *   mode).
 * @param options.createdInstance Signal of the instance the directive builds
 *   when it owns the control.
 * @param options.isInstance Type guard narrowing an `AbstractControl` to the
 *   directive's concrete control type.
 * @returns The resolved {@link BindMode} helpers.
 */
export function withBindMode<C extends AbstractControl>(options: {
  parent: FormParent;
  controlName: Signal<string>;
  createdInstance: Signal<C>;
  isInstance: (control: AbstractControl) => control is C;
}): BindMode<C> {
  const bindMode = inject(NGXFB_BIND_MODE, { optional: true }) ?? false;

  const adoptedInstance = (): C | null => {
    const control = options.parent.control?.get(options.controlName());
    return control && options.isInstance(control) ? control : null;
  };

  const instance = computed<C>(() => {
    if (bindMode) {
      return adoptedInstance() ?? options.createdInstance();
    }
    return options.createdInstance();
  });

  return {
    bindMode,
    instance,
    isRowTop(): boolean {
      return bindMode && options.parent.control instanceof FormArray;
    },
  };
}
