import { computed, inject, Injectable, signal, Type } from '@angular/core';
import {
  ComponentResolver,
  NGX_FW_COMPONENT_REGISTRATIONS,
} from '@ngx-formbar/core';

@Injectable()
export class HybridComponentResolver implements ComponentResolver {
  private readonly defaultRegistrations = inject(
    NGX_FW_COMPONENT_REGISTRATIONS,
  );

  private readonly dynamicRegistrations = signal(
    new Map<string, Type<unknown>>(),
  );

  readonly registrations = computed(() => {
    const result = new Map<string, Type<unknown>>(this.defaultRegistrations);

    for (const [key, component] of this.dynamicRegistrations()) {
      result.set(key, component);
    }
    return result;
  });

  updateDynamicComponent(key: string, component: Type<unknown>) {
    const current = new Map(this.dynamicRegistrations());
    current.set(key, component);
    this.dynamicRegistrations.set(current);
  }
}
