import { NgxFbControl } from '@ngx-formbar/core';
import {
  computed,
  inputBinding,
  reflectComponentType,
  Signal,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { createBinding } from './bindings';

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

  const mirror = reflectComponentType(component);
  const inputNames = mirror?.inputs.map((i) => i.templateName) ?? [];

  const bindings = inputNames.map((templateName) => {
    switch (templateName) {
      case 'name':
        return inputBinding(templateName, controlName);
      case 'label':
        return inputBinding(
          templateName,
          computed(() => controlConfig().label),
        );
      default:
        return createBinding(templateName, controlConfig());
    }
  });

  return viewContainerRef.createComponent(component, {
    bindings: [...bindings],
  });
}
