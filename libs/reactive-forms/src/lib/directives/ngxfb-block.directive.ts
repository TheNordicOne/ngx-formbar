import {
  afterRenderEffect,
  ComponentRef,
  DestroyRef,
  Directive,
  inject,
  input,
  Signal,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { NgxFbBlock } from '@ngx-formbar/core';
import { FormConfigEntry } from '../types/control-component.type';
import { createBindings } from '../setup/bindings';
import { withHiddenState } from '../composables/hidden.state';
import { withTestId } from '../composables/testId';
import { withBase } from '../composables/base';

@Directive({
  selector: '[ngxfbBlock]',
})
export class NgxfbBlockDirective {
  private viewContainerRef = inject(ViewContainerRef);
  private destroyRef = inject(DestroyRef);

  readonly config = input.required<FormConfigEntry<NgxFbBlock>>({
    alias: 'ngxfbBlock',
  });

  private componentRef?: ComponentRef<unknown>;

  private readonly base = withBase(this.config);
  private readonly controlConfig = this.base.controlConfig;
  private readonly controlName = this.base.controlName;

  private readonly isHidden = withHiddenState(this.controlConfig);

  private readonly testId = withTestId(this.controlConfig, this.controlName);

  private readonly signalMap = new Map<string, Signal<unknown>>([
    ['isHidden', this.isHidden],
    ['testId', this.testId],
  ]);

  constructor() {
    afterRenderEffect(() => {
      const component = this.base.component();

      this.viewContainerRef.clear();

      if (!component) {
        return;
      }

      this.instantiateComponent(component);
    });

    this.destroyRef.onDestroy(() => {
      this.componentRef?.destroy();
    });
  }

  private instantiateComponent(component: Type<unknown>) {
    const bindings = createBindings(
      component,
      this.signalMap,
      this.controlConfig,
    );

    this.componentRef = this.viewContainerRef.createComponent(component, {
      bindings: [...bindings],
    });
  }
}
