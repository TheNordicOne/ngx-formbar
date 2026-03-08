import { computed, Signal } from '@angular/core';
import { StateHandling } from '../types/registration.type';

/**
 * Resolves the hidden attribute value for DOM binding
 *
 * When visibilityHandling is 'auto', returns `true` (attribute present)
 * or `null` (attribute absent) based on the hidden state.
 * When visibilityHandling is 'manual', always returns `null` so the
 * component can handle visibility itself.
 *
 * @param options Configuration object
 * @param options.hiddenSignal Signal indicating whether the element should be hidden
 * @param options.hiddenHandlingSignal Signal for the visibility handling strategy
 * @returns Computed signal resolving to `true` (hidden) or `null` (visible)
 */
export function resolveHiddenAttribute(options: {
  hiddenSignal: Signal<boolean>;
  hiddenHandlingSignal: Signal<StateHandling>;
}) {
  return computed(() => {
    const isHidden = options.hiddenSignal();
    const visibilityHandling = options.hiddenHandlingSignal();
    if (visibilityHandling !== 'auto') {
      return null;
    }
    return isHidden ? true : null;
  });
}
