import { computed, inject, Signal } from '@angular/core';
import {
  NgxFwAbstractControl,
  NgxFwFormGroup,
  UpdateStrategy,
} from '../types/content.type';

import { NgxfwGroupDirective } from '../directives/ngxfw-group.directive';
import { NGX_FW_DEFAULT_UPDATE_STRATEGY } from '../tokens/default-update-strategy';

/**
 * Creates a computed signal for the control's update strategy
 *
 * This function determines when form controls should update:
 * - Uses the control's specified updateOn strategy if defined
 * - Falls back to parent group's strategy when not defined in the control
 * - Handles inheritance of update strategies through the form hierarchy
 * - Uses the application's default strategy as final fallback
 *
 * Update strategies control when form values and validation happen:
 * - 'change': Update on every change event (default Angular behavior)
 * - 'blur': Update when the control loses focus
 * - 'submit': Update only when the form is submitted
 *
 * @param content Signal containing the NgxFwAbstractControl with possible updateOn configuration
 * @returns Computed signal providing the resolved update strategy
 */
export function withUpdateStrategy(content: Signal<NgxFwAbstractControl>) {
  const parentGroupDirective: NgxfwGroupDirective<NgxFwFormGroup> | null =
    inject(NgxfwGroupDirective<NgxFwFormGroup>, {
      optional: true,
      skipSelf: true,
    });

  const defaultUpdateStrategy = inject(NGX_FW_DEFAULT_UPDATE_STRATEGY);

  const parentGroupUpdateStrategy: Signal<UpdateStrategy> =
    computed<UpdateStrategy>(() => {
      return parentGroupDirective?.updateStrategy();
    });

  return computed<UpdateStrategy>(() => {
    return (
      content().updateOn ?? parentGroupUpdateStrategy() ?? defaultUpdateStrategy
    );
  });
}
