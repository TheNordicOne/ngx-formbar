import { NgxFbBlock } from '@ngx-formbar/core';
import { Signal, Type, ViewContainerRef } from '@angular/core';
import { createBindings } from './bindings';

export function setupBlock(params: {
  component: Type<unknown>;
  controlConfig: Signal<NgxFbBlock>;
  viewContainerRef: ViewContainerRef;
}) {
  const { component, controlConfig, viewContainerRef } = params;

  const signalMap = new Map<string, Signal<unknown>>();
  const bindings = createBindings(component, signalMap, controlConfig);

  return viewContainerRef.createComponent(component, {
    bindings: [...bindings],
  });
}
