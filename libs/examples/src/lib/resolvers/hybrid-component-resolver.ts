import { computed, inject, Injectable, signal } from '@angular/core';
import {
  ComponentResolver,
  LoadComponentFn,
  NGX_FW_COMPONENT_REGISTRATIONS,
} from '@ngx-formbar/core';

@Injectable()
export class HybridComponentResolver implements ComponentResolver {
  private readonly defaultRegistrations = inject(
    NGX_FW_COMPONENT_REGISTRATIONS,
  );

  private readonly dynamicRegistrations = signal(
    new Map<string, LoadComponentFn>(),
  );

  readonly registrations = computed(() => {
    const result = new Map<string, LoadComponentFn>(this.defaultRegistrations);

    for (const [key, component] of this.dynamicRegistrations()) {
      result.set(key, component);
    }
    return result;
  });

  updateDynamicComponent(key: string, component: LoadComponentFn) {
    const current = new Map(this.dynamicRegistrations());
    current.set(key, component);
    this.dynamicRegistrations.set(current);
  }
}
