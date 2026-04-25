import {
  afterRenderEffect,
  ComponentRef,
  computed,
  DestroyRef,
  Directive,
  inject,
  Injector,
  input,
  Signal,
  Type,
  ViewContainerRef,
} from '@angular/core';
import {
  NGX_FW_COMPONENT_RESOLVER,
  NgxFbBaseContent,
  NgxFbContent,
  NgxFbFormGroup,
} from '@ngx-formbar/core';
import { FormConfigEntry } from '../types/control-component.type';
import { withLoadedComponent } from '../composables/loaded-component';
import { ControlContainer, FormGroup } from '@angular/forms';
import { createBindings } from '../setup/bindings';
import { NGXFB_CONTROL_ENTRIES } from '../tokens/control-entries';
import { withDynamicTitle } from '../composables/dynamic-title';
import { withHiddenState } from '../composables/hidden.state';

@Directive({
  selector: '[ngxfbGroup]',
})
export class NgxfbGroupDirective<T extends NgxFbBaseContent = NgxFbContent> {
  private viewContainerRef = inject(ViewContainerRef);
  private destroyRef = inject(DestroyRef);
  private parentContainer = inject(ControlContainer);
  private readonly contentRegistrationService = inject(
    NGX_FW_COMPONENT_RESOLVER,
  );

  readonly config = input.required<FormConfigEntry<NgxFbFormGroup<T>>>({
    alias: 'ngxfbGroup',
  });

  private componentRef?: ComponentRef<unknown>;

  private readonly registrations =
    this.contentRegistrationService.registrations;

  private readonly controlConfig = computed(() => this.config().config);
  private readonly controlName = computed(() => this.config().name);

  private readonly registrationEntry = computed(() => {
    const registrations = this.registrations();
    const config = this.controlConfig();
    return registrations.get(config.type) ?? null;
  });

  private readonly component = withLoadedComponent(this.registrationEntry);

  // Public API
  readonly isHidden = withHiddenState(this.controlConfig);

  private readonly signalMap = new Map<string, Signal<unknown>>([
    ['name', this.controlName],
    ['isHidden', this.isHidden],
    ['titleText', computed(() => this.controlConfig().title)],
    ['dynamicTitle', withDynamicTitle(this.controlConfig)],
  ]);

  /**
   * Access to the parent FormGroup containing this group
   */
  private get parentFormGroup() {
    return this.parentContainer.control as FormGroup | null;
  }

  constructor() {
    afterRenderEffect(() => {
      const component = this.component();

      this.viewContainerRef.clear();

      if (!component || !this.parentFormGroup) {
        return;
      }

      this.setGroup();

      this.instantiateComponent(component);
    });

    this.destroyRef.onDestroy(() => {
      this.componentRef?.destroy();
      this.parentFormGroup?.removeControl(this.controlName(), {
        emitEvent: false,
      });
    });
  }

  private setGroup() {
    const controlInstance = new FormGroup({}, {});

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

    const groupControls = computed<FormConfigEntry<NgxFbContent>[]>(() =>
      Object.entries(this.controlConfig().controls).map(([name, config]) => ({
        name,
        config,
      })),
    );

    const componentInjector = Injector.create({
      providers: [{ provide: NGXFB_CONTROL_ENTRIES, useValue: groupControls }],
      parent: this.viewContainerRef.injector,
    });

    this.componentRef = this.viewContainerRef.createComponent(component, {
      bindings: [...bindings],
      injector: componentInjector,
    });
  }
}
