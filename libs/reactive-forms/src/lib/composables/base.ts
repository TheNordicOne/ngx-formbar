import { computed, inject, Signal } from '@angular/core';
import { NGX_FW_COMPONENT_RESOLVER, NgxFbBaseContent } from '@ngx-formbar/core';
import { FormConfigEntry } from '../types/control-component.type';
import { withLoadedComponent } from './loaded-component';

/**
 * Base signals derived from a directive's `config` input. Returns the inner
 * config, the entry name, the matching registration entry, and the loaded
 * component class.
 *
 * @param config Signal of the directive's `FormConfigEntry` input. The entry
 *   wraps both the bound name and the inner content config; both are split
 *   into separate signals on the returned object.
 * @returns An object with `controlConfig` (inner content), `controlName`
 *   (entry name), `registrationEntry` (resolved component registration or
 *   `null` when no match), and `component` (loaded component class signal).
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
