import { computed, inject, Signal } from '@angular/core';
import {
  NgxFbAbstractControl,
  NgxFbFormGroup,
  UpdateStrategy,
} from '../types/content.type';
import { NGX_FW_DEFAULT_UPDATE_STRATEGY } from '../tokens/default-update-strategy';
import { NgxfbGroupDirective } from '../directives/ngxfw-group.directive';

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
 * @param content Signal containing the NgxFbAbstractControl with possible updateOn configuration
 * @returns Computed signal providing the resolved update strategy
 */
export function withUpdateStrategy(content: Signal<NgxFbAbstractControl>) {
  const parentGroupDirective: NgxfbGroupDirective<NgxFbFormGroup> | null =
    inject(NgxfbGroupDirective<NgxFbFormGroup>, {
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
