import { computed, Signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import {
  ComponentRegistrationEntry,
  NgxFbAbstractControl,
} from '@ngx-formbar/core';
import { disabledEffect, withDisabledState } from './disabled.state';

/**
 * Resolves the disabled state from the directive's config and wires the
 * enable/disable effect against the given form instance when the registered
 * component opts into automatic handling.
 *
 * @param options.controlConfig Signal of the directive's inner config.
 * @param options.registrationEntry Signal of the resolved component registration; consulted for `disabledHandling`.
 * @param options.instance Signal resolving to the FormControl/FormGroup whose enable/disable should follow the disabled state.
 * @returns The resolved `isDisabled` signal.
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
