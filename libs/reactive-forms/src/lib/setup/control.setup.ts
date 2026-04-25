import { NgxFbControl } from '@ngx-formbar/core';
import { computed, Signal, Type, ViewContainerRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { createBindings } from './bindings';

export function setupControl(params: {
  component: Type<unknown>;
  controlConfig: Signal<NgxFbControl>;
  controlName: Signal<string>;
  parentFormGroup: FormGroup;
  viewContainerRef: ViewContainerRef;
}) {
  const {
    component,
    controlConfig,
    controlName,
    parentFormGroup,
    viewContainerRef,
  } = params;

  const controlInstance = new FormControl(null, {});

  parentFormGroup.setControl(controlName(), controlInstance, {
    emitEvent: false,
  });

  const signalMap = new Map<string, Signal<unknown>>([
    ['name', controlName],
    ['label', computed(() => controlConfig().label)],
  ]);

  const bindings = createBindings(component, signalMap, controlConfig);

  return viewContainerRef.createComponent(component, {
    bindings: [...bindings],
  });
}
