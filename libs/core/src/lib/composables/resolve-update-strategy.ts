import { computed, Signal } from '@angular/core';
import { UpdateStrategy } from '../types/content.type';

/**
 * Resolves the update strategy for a form control or group.
 *
 * Falls back from the control's own `updateOn`, to the parent group's strategy,
 * to the application-wide default.
 *
 * @param controlUpdateOn Signal carrying the control's own `updateOn` value.
 *   Wins when set.
 * @param parentStrategy Signal exposing the resolved strategy of the enclosing
 *   group. Used when the control has none of its own.
 * @param defaultStrategy Final fallback supplied through library configuration.
 * @returns Computed signal whose value can be passed to `FormControl`'s
 *   `updateOn` option.
 */
export function resolveUpdateStrategy(
  controlUpdateOn: Signal<UpdateStrategy | undefined>,
  parentStrategy: Signal<UpdateStrategy | undefined>,
  defaultStrategy: UpdateStrategy,
) {
  return computed<UpdateStrategy>(() => {
    return controlUpdateOn() ?? parentStrategy() ?? defaultStrategy;
  });
}
