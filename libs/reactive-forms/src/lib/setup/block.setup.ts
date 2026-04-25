import { NgxFbBlock } from '@ngx-formbar/core';
import { Signal, Type, ViewContainerRef } from '@angular/core';
import { createBinding, getInputNames } from './bindings';

export function setupBlock(params: {
  component: Type<unknown>;
  controlConfig: Signal<NgxFbBlock>;
  viewContainerRef: ViewContainerRef;
}) {
  const { component, controlConfig, viewContainerRef } = params;

  const inputNames = getInputNames(component);

  const bindings = inputNames.map((templateName) =>
    createBinding(templateName, controlConfig()),
  );

  return viewContainerRef.createComponent(component, {
    bindings: [...bindings],
  });
}
