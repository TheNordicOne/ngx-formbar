import { computed, inject, Signal } from '@angular/core';
import {
  NgxFbAbstractControl,
  NgxFbFormGroup,
  UpdateStrategy,
  resolveUpdateStrategy,
  NGX_FW_DEFAULT_UPDATE_STRATEGY,
} from '@ngx-formbar/core';
import { NgxFbGroupDirective } from '../directives/ngx-fb-group.directive';

/**
 * Creates a computed signal for the control's update strategy.
 *
 * Resolution priority:
 * 1. The control's own `updateOn` if defined
 * 2. The parent group's update strategy
 * 3. The application's default update strategy
 *
 * Update strategies control when form values and validation happen:
 * - `'change'`: every change event (Angular default)
 * - `'blur'`: when the control loses focus
 * - `'submit'`: only on form submission
 *
 * @param content Signal containing the NgxFbAbstractControl with optional `updateOn`
 * @returns Computed signal providing the resolved update strategy
 */
export function withUpdateStrategy(
  content: Signal<NgxFbAbstractControl>,
): Signal<UpdateStrategy> {
  const parentGroupDirective: NgxFbGroupDirective<NgxFbFormGroup> | null =
    inject(NgxFbGroupDirective<NgxFbFormGroup>, {
      optional: true,
      skipSelf: true,
    });

  const defaultUpdateStrategy = inject(NGX_FW_DEFAULT_UPDATE_STRATEGY);

  return resolveUpdateStrategy(
    computed(() => content().updateOn),
    computed(() => parentGroupDirective?.updateStrategy()),
    defaultUpdateStrategy,
  );
}
