import { NgxFbFormGroup } from '@ngx-formbar/core';
import {
  computed,
  Injector,
  Signal,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { createBindings } from './bindings';
import { NGXFB_GROUP_CONTROLS } from '../tokens/group-controls';

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

  const signalMap = new Map<string, Signal<unknown>>([
    ['name', controlName],
    ['title', computed(() => controlConfig().title)],
  ]);

  const bindings = createBindings(component, signalMap, controlConfig);

  const groupControls = computed(() =>
    Object.entries(controlConfig().controls),
  );

  const injector = Injector.create({
    providers: [{ provide: NGXFB_GROUP_CONTROLS, useValue: groupControls }],
    parent: viewContainerRef.injector,
  });

  return viewContainerRef.createComponent(component, {
    bindings: [...bindings],
    injector,
  });
}
