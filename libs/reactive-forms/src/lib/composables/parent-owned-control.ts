import { computed, inject, Signal, Type } from '@angular/core';
import { AbstractControl, FormArray } from '@angular/forms';
import { NGXFB_PARENT_OWNED_CONTROL } from '../tokens/parent-owned-control';
import { FormParent } from './form-parent';

export interface ParentOwnedControl<C extends AbstractControl> {
  /**
   * The control the directive should render: the one already held by the
   * parent inside a `FormArray` subtree, otherwise the freshly created one.
   */
  readonly instance: Signal<C>;
  /**
   * `true` when the directive renders a row directly under the `FormArray`
   * (its immediate parent is the array). The `FormArray` owns row membership
   * by index, so a row top never attaches, detaches, or runs teardown.
   */
  isDirectFormArrayChild: boolean;
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
 * @param options.controlType The concrete control class this directive renders.
 *   A parent-held control is adopted only when it is an instance of this class.
 */
export function withParentOwnedControl<C extends AbstractControl>(options: {
  parent: FormParent;
  controlName: Signal<string>;
  createdInstance: Signal<C>;
  controlType: Type<C>;
}): ParentOwnedControl<C> {
  const isParentOwned =
    inject(NGXFB_PARENT_OWNED_CONTROL, { optional: true }) ?? false;

  const existingInstance = computed(() => {
    const control = options.parent.control?.get(options.controlName());
    return control instanceof options.controlType ? control : null;
  });

  const instance = computed<C>(() => {
    if (isParentOwned) {
      return existingInstance() ?? options.createdInstance();
    }
    return options.createdInstance();
  });

  return {
    instance,
    isDirectFormArrayChild:
      isParentOwned && options.parent.control instanceof FormArray,
  };
}
