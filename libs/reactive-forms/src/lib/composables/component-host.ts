import {
  ComponentRef,
  DestroyRef,
  inject,
  Injector,
  Provider,
  Signal,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { createBindings } from '../setup/bindings';

export interface ComponentHostOptions {
  signalMap: Map<string, Signal<unknown>>;
  controlConfig: Signal<object>;
  additionalProviders?: Provider[];
}

export interface ComponentHost {
  mount(component: Type<unknown>): void;
  clear(): void;
}

/**
 * Provisions a managed host for a single dynamically created component.
 * The returned handle exposes `mount(component)` to populate the host and
 * `clear()` to empty it; the underlying component is destroyed automatically
 * when the directive is torn down.
 *
 * @param options.signalMap Map of input names to the signals that back them.
 * @param options.controlConfig Signal of the directive's inner config; consulted for inputs not present in the signalMap.
 * @param options.additionalProviders Extra providers to attach via a child injector (e.g. NGXFB_CONTROL_ENTRIES for groups).
 */
export function withComponentHost(options: ComponentHostOptions) {
  const viewContainerRef = inject(ViewContainerRef);
  const destroyRef = inject(DestroyRef);
  let componentRef: ComponentRef<unknown> | undefined;

  destroyRef.onDestroy(() => {
    componentRef?.destroy();
  });

  const childInjector = options.additionalProviders
    ? Injector.create({
        providers: options.additionalProviders,
        parent: viewContainerRef.injector,
      })
    : undefined;

  return {
    mount(component: Type<unknown>) {
      const bindings = createBindings(
        component,
        options.signalMap,
        options.controlConfig,
      );
      componentRef = viewContainerRef.createComponent(component, {
        bindings: [...bindings],
        injector: childInjector,
      });
    },
    clear() {
      viewContainerRef.clear();
      componentRef = undefined;
    },
  };
}
