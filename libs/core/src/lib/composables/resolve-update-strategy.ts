import { computed, Signal } from '@angular/core';
import { UpdateStrategy } from '../types/content.type';

/**
 * Resolves the update strategy for a form control or group
 *
 * The strategy is determined using the following priority:
 * 1. The control's own updateOn value if defined
 * 2. The parent group's strategy if defined
 * 3. The application-wide default strategy
 *
 * @param controlUpdateOn Signal containing the control's updateOn configuration
 * @param parentStrategy Signal providing the parent group's update strategy
 * @param defaultStrategy The application-wide default update strategy
 * @returns Computed signal providing the resolved update strategy
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
