import { NgxFbControl } from '@ngx-formbar/core';
import {
  computed,
  inputBinding,
  Signal,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { createBinding, getInputNames } from './bindings';

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

  const inputNames = getInputNames(component);

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
