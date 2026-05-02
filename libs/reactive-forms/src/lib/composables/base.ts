import { computed, inject, Signal } from '@angular/core';
import { NGX_FW_COMPONENT_RESOLVER, NgxFbBaseContent } from '@ngx-formbar/core';
import { FormConfigEntry } from '../types/control-component.type';
import { withLoadedComponent } from './loaded-component';

/**
 * Base signals derived from the directive's `config` input that every
 * formbar directive builds on: the inner config, the entry name, the
 * matching registration entry, and the loaded component class.
 *
 * @param config Signal of the directive's FormConfigEntry input
 */
export function withBase<T extends NgxFbBaseContent>(
  config: Signal<FormConfigEntry<T>>,
) {
  const registrations = inject(NGX_FW_COMPONENT_RESOLVER).registrations;

  const controlConfig = computed(() => config().config);
  const controlName = computed(() => config().name);

  const registrationEntry = computed(
    () => registrations().get(controlConfig().type) ?? null,
  );

  const component = withLoadedComponent(registrationEntry);

  return {
    controlConfig,
    controlName,
    registrationEntry,
    component,
  };
}
