import {
  afterRenderEffect,
  ComponentRef,
  computed,
  DestroyRef,
  Directive,
  inject,
  input,
  ViewContainerRef,
} from '@angular/core';
import {
  isFormbarBlock,
  isFormbarControl,
  isFormbarGroup,
  NGX_FW_COMPONENT_RESOLVER,
  NgxFbBaseContent,
  NgxFbContent,
} from '@ngx-formbar/core';
import { FormConfigEntry } from '../types/control-component.type';
import { withLoadedComponent } from '../composables/loaded-component';
import { ControlContainer, FormGroup } from '@angular/forms';
import { setupControl } from '../setup/control.setup';
import { setupBlock } from '../setup/block.setup';
import { setupGroup } from '../setup/group.setup';

@Directive({
  selector: '[ngxfbAbstractControl]',
})
export class NgxfbAbstractControlDirective<
  T extends NgxFbBaseContent = NgxFbContent,
> {
  private viewContainerRef = inject(ViewContainerRef);
  private destroyRef = inject(DestroyRef);
  private parentContainer = inject(ControlContainer);
  private readonly contentRegistrationService = inject(
    NGX_FW_COMPONENT_RESOLVER,
  );

  readonly config = input.required({
    alias: 'ngxfbAbstractControl',
    transform: (v: [string, T]): FormConfigEntry<T> => ({
      name: v[0],
      config: v[1],
    }),
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

  readonly component = withLoadedComponent(this.registrationEntry);

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

      if (isFormbarBlock(this.controlConfig)) {
        this.componentRef = setupBlock({
          component,
          controlConfig: this.controlConfig,
          viewContainerRef: this.viewContainerRef,
        });
        return;
      }

      if (isFormbarGroup(this.controlConfig)) {
        this.componentRef = setupGroup({
          component,
          controlConfig: this.controlConfig,
          controlName: this.controlName,
          parentFormGroup: this.parentFormGroup,
          viewContainerRef: this.viewContainerRef,
        });
        return;
      }

      if (!isFormbarControl(this.controlConfig)) {
        return;
      }

      this.componentRef = setupControl({
        component,
        controlConfig: this.controlConfig,
        controlName: this.controlName,
        parentFormGroup: this.parentFormGroup,
        viewContainerRef: this.viewContainerRef,
      });
    });

    this.destroyRef.onDestroy(() => {
      this.componentRef?.destroy();
      this.parentFormGroup?.removeControl(this.controlName(), {
        emitEvent: false,
      });
    });
  }
}
