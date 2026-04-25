import {
  afterRenderEffect,
  ComponentRef,
  computed,
  DestroyRef,
  Directive,
  inject,
  input,
  Signal,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { NGX_FW_COMPONENT_RESOLVER, NgxFbControl } from '@ngx-formbar/core';
import { FormConfigEntry } from '../types/control-component.type';
import { withLoadedComponent } from '../composables/loaded-component';
import { ControlContainer, FormControl, FormGroup } from '@angular/forms';
import { createBindings } from '../setup/bindings';

@Directive({
  selector: '[ngxfbControl]',
})
export class NgxfbControlDirective {
  private viewContainerRef = inject(ViewContainerRef);
  private destroyRef = inject(DestroyRef);
  private parentContainer = inject(ControlContainer);
  private readonly contentRegistrationService = inject(
    NGX_FW_COMPONENT_RESOLVER,
  );

  readonly config = input.required<FormConfigEntry<NgxFbControl>>({
    alias: 'ngxfbControl',
  });

  private componentRef?: ComponentRef<unknown>;

  private readonly registrations =
    this.contentRegistrationService.registrations;

  private readonly controlConfig = computed(() => this.config().config);
  private readonly controlName = computed(() => this.config().name);

  private readonly registrationEntry = computed(() => {
    const registrations = this.registrations();
    const content = this.controlConfig();
    return registrations.get(content.type) ?? null;
  });

  private readonly component = withLoadedComponent(this.registrationEntry);

  private readonly signalMap = new Map<string, Signal<unknown>>([
    ['name', this.controlName],
    ['label', computed(() => this.controlConfig().label)],
  ]);

  /**
   * Access to the parent FormGroup containing this control
   */
  get parentFormGroup() {
    return this.parentContainer.control as FormGroup | null;
  }

  constructor() {
    afterRenderEffect(() => {
      const component = this.component();

      this.viewContainerRef.clear();

      if (!component || !this.parentFormGroup) {
        return;
      }

      this.setControl();

      this.instantiateComponent(component);
    });

    this.destroyRef.onDestroy(() => {
      this.componentRef?.destroy();
      this.parentFormGroup?.removeControl(this.controlName(), {
        emitEvent: false,
      });
    });
  }

  private setControl() {
    const controlInstance = new FormControl(null, {});

    this.parentFormGroup?.setControl(this.controlName(), controlInstance, {
      emitEvent: false,
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
