import { computed, Signal } from '@angular/core';

/**
 * Resolves the value of the `hidden` DOM attribute.
 *
 * Returns `true` when the library manages visibility and the element is hidden,
 * `null` otherwise. When the component manages visibility itself, always returns `null`.
 *
 * @param options Inputs for the binding.
 * @param options.hiddenSignal Signal that reports whether the element should be
 *   hidden in the DOM.
 * @param options.handleVisibility Signal indicating whether the library is
 *   responsible for visibility. When `false` the attribute is never set so the
 *   component can render its own hide behavior.
 * @returns Computed signal whose value is suitable for binding to the native
 *   `hidden` attribute: `true` to set it, `null` to remove it.
 */
export function resolveHiddenAttribute(options: {
  hiddenSignal: Signal<boolean>;
  handleVisibility: Signal<boolean>;
}): Signal<true | null> {
  return computed(() => {
    if (!options.handleVisibility()) {
      return null;
    }
    return options.hiddenSignal() ? true : null;
  });
}
