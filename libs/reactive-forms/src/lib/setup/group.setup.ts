import { NgxFbFormGroup } from '@ngx-formbar/core';
import {
  computed,
  inputBinding,
  reflectComponentType,
  Signal,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { createBinding } from './bindings';

export function setupGroup(params: {
  component: Type<unknown>;
  controlConfig: Signal<NgxFbFormGroup>;
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

  const controlInstance = new FormGroup({}, {});

  parentFormGroup.setControl(controlName(), controlInstance, {
    emitEvent: false,
  });

  const mirror = reflectComponentType(component);
  const inputNames = mirror?.inputs.map((i) => i.templateName) ?? [];

  const bindings = inputNames.map((templateName) => {
    switch (templateName) {
      case 'name':
        return inputBinding(templateName, controlName);
      case 'title':
        return inputBinding(
          templateName,
          computed(() => controlConfig().title),
        );
      case 'controls':
        return inputBinding(
          templateName,
          computed(() => Object.entries(controlConfig().controls)),
        );
      default:
        return createBinding(templateName, controlConfig());
    }
  });

  return viewContainerRef.createComponent(component, {
    bindings: [...bindings],
  });
}
