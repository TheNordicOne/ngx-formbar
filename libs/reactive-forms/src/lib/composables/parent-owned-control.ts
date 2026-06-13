import { computed, inject, Signal } from '@angular/core';
import { AbstractControl, FormArray } from '@angular/forms';
import { NGXFB_PARENT_OWNED_CONTROL } from '../tokens/parent-owned-control';
import { FormParent } from './form-parent';

export interface ParentOwnedControl<C extends AbstractControl> {
  /**
   * `true` inside a `FormArray` subtree, where the parent already holds the
   * control. The directive reuses that control instead of creating and
   * self-registering its own.
   */
  readonly isParentOwned: boolean;
  /**
   * The control the directive should render: the one already held by the
   * parent when {@link isParentOwned}, otherwise the freshly created one.
   */
  readonly instance: Signal<C>;
  /**
   * `true` when the directive renders a row directly under the `FormArray`
   * (its immediate parent is the array). The `FormArray` owns row membership
   * by index, so a row top never attaches, detaches, or runs teardown.
   */
  isRowTop(): boolean;
}

/**
 * Resolves which control a row-rendering directive should use. The control and
 * group directives normally create their control and self-register it with the
 * parent. Inside a `FormArray` the row's controls are pre-built by
 * {@link RowFactoryService} and held by the array, so the same directive must
 * reuse the existing control rather than create a duplicate. Reads
 * {@link NGXFB_PARENT_OWNED_CONTROL} to tell the two situations apart.
 *
 * @param options.parent The directive's resolved {@link FormParent}.
 * @param options.controlName Name of the control under its parent (the row
 *   index when the parent is a `FormArray`).
 * @param options.createdInstance The instance the directive builds when it owns
 *   the control.
 * @param options.isInstance Type guard narrowing an `AbstractControl` to the
 *   directive's concrete control type.
 */
export function withParentOwnedControl<C extends AbstractControl>(options: {
  parent: FormParent;
  controlName: Signal<string>;
  createdInstance: Signal<C>;
  isInstance: (control: AbstractControl) => control is C;
}): ParentOwnedControl<C> {
  const isParentOwned =
    inject(NGXFB_PARENT_OWNED_CONTROL, { optional: true }) ?? false;

  const existingInstance = (): C | null => {
    const control = options.parent.control?.get(options.controlName());
    return control && options.isInstance(control) ? control : null;
  };

  const instance = computed<C>(() => {
    if (isParentOwned) {
      return existingInstance() ?? options.createdInstance();
    }
    return options.createdInstance();
  });

  return {
    isParentOwned,
    instance,
    isRowTop(): boolean {
      return isParentOwned && options.parent.control instanceof FormArray;
    },
  };
}
