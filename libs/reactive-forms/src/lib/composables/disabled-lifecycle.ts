import { computed, Signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import {
  ComponentRegistrationEntry,
  NgxFbAbstractControl,
  withDisabledState,
} from '@ngx-formbar/core';
import { disabledEffect } from './disabled-effect';

/**
 * Resolves the disabled state from the directive's config and wires the
 * enable/disable effect on the form instance when the registered component
 * opts into automatic handling.
 *
 * @param options.controlConfig Signal of the directive's inner content config.
 *   Provides the `disabled` field consulted by `withDisabledState`.
 * @param options.registrationEntry Signal of the resolved component
 *   registration. Its `disabledHandling` property toggles the effect: `auto`
 *   (default) lets the library call `enable()`/`disable()`; any other value
 *   makes the effect a no-op so the component handles the state itself.
 * @param options.instance Signal of the `FormControl` or `FormGroup` whose
 *   enable/disable should follow the resolved disabled signal.
 * @returns The resolved `isDisabled` signal, suitable for binding to a
 *   component input or for use as a precondition by other composables.
 */
export function withDisabledLifecycle(options: {
  controlConfig: Signal<NgxFbAbstractControl>;
  registrationEntry: Signal<ComponentRegistrationEntry | null>;
  instance: Signal<AbstractControl>;
}): Signal<boolean> {
  const isDisabled = withDisabledState(options.controlConfig);
  const handleDisable = computed(
    () => (options.registrationEntry()?.disabledHandling ?? 'auto') === 'auto',
  );

  disabledEffect({
    disabledSignal: isDisabled,
    handleDisableSignal: handleDisable,
    instance: options.instance,
  });

  return isDisabled;
}
