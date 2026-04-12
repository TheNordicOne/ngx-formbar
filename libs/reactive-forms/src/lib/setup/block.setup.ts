import { NgxFbBlock } from '@ngx-formbar/core';
import {
  reflectComponentType,
  Signal,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { createBinding } from './bindings';

export function setupBlock(params: {
  component: Type<unknown>;
  controlConfig: Signal<NgxFbBlock>;
  viewContainerRef: ViewContainerRef;
}) {
  const { component, controlConfig, viewContainerRef } = params;

  const mirror = reflectComponentType(component);
  const inputNames = mirror?.inputs.map((i) => i.templateName) ?? [];

  const bindings = inputNames.map((templateName) =>
    createBinding(templateName, controlConfig()),
  );

  return viewContainerRef.createComponent(component, {
    bindings: [...bindings],
  });
}
