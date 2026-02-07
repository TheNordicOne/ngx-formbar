import { effect, Signal, untracked } from '@angular/core';
import { StateHandling } from '../types/registration.type';
import { SimpleFunction } from '../types/functions.type';

/**
 * Creates an effect that manages disabled state transitions
 *
 * When disabledHandling is 'auto', calls the appropriate enable/disable
 * function based on the disabled signal. When 'manual', does nothing.
 *
 * @param options Configuration object for disabled effect
 * @param options.disabledSignal Signal that indicates if the component should be disabled
 * @param options.disabledHandlingSignal Signal that determines how disabled state changes should be handled
 * @param options.enableFunction Function to call when component should be enabled
 * @param options.disableFunction Function to call when component should be disabled
 */
export function resolveDisabledEffect(options: {
  disabledSignal: Signal<boolean>;
  disabledHandlingSignal: Signal<StateHandling>;
  enableFunction: SimpleFunction;
  disableFunction: SimpleFunction;
}) {
  effect(() => {
    const disabled = options.disabledSignal();
    const disabledHandling = options.disabledHandlingSignal();

    if (disabledHandling === 'manual') {
      return;
    }

    if (!disabled) {
      untracked(() => {
        options.enableFunction();
      });
      return;
    }
    untracked(() => {
      options.disableFunction();
    });
  });
}
