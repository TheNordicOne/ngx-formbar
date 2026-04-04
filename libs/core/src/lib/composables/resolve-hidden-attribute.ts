import { computed, Signal } from '@angular/core';

/**
 * Resolves the hidden attribute value for DOM binding
 *
 * When the library handles visibility, returns `true` (attribute present)
 * or `null` (attribute absent) based on the hidden state.
 * When the component handles visibility itself, always returns `null`.
 *
 * @param options Configuration object
 * @param options.hiddenSignal Signal indicating whether the element should be hidden
 * @param options.handleVisibility Signal indicating whether the library manages visibility
 * @returns Computed signal resolving to `true` (hidden) or `null` (visible)
 */
export function resolveHiddenAttribute(options: {
  hiddenSignal: Signal<boolean>;
  handleVisibility: Signal<boolean>;
}) {
  return computed(() => {
    if (!options.handleVisibility()) {
      return null;
    }
    return options.hiddenSignal() ? true : null;
  });
}
