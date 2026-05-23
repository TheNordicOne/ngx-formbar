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
import { createBindings } from '../helper/bindings';

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
 * Manages a host for a dynamically created component. Call `mount(component)`
 * to populate the host and `clear()` to empty it. The component is destroyed
 * automatically when the directive is torn down.
 *
 * @param options.signalMap Map of input names to the signals that back them.
 *   Each entry is converted into a reactive binding on the mounted component.
 * @param options.controlConfig Signal of the directive's inner config. Used
 *   to resolve any inputs declared on the component but absent from
 *   `signalMap`, so unmapped inputs still receive their static config value.
 * @param options.additionalProviders Optional providers attached via a child
 *   injector that wraps the host's own injector. Use to expose tokens such
 *   as `NGXFB_CONTROL_ENTRIES` to the mounted component tree.
 * @returns A `ComponentHost` handle exposing `mount` and `clear`.
 */
export function withComponentHost(
  options: ComponentHostOptions,
): ComponentHost {
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
