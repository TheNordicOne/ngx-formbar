import {
  afterRenderEffect,
  ComponentRef,
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  Signal,
  Type,
  untracked,
  ViewContainerRef,
} from '@angular/core';
import {
  NGX_FW_COMPONENT_RESOLVER,
  NgxFbControl,
  NgxFbFormGroup,
  ValueStrategy,
} from '@ngx-formbar/core';
import { FormConfigEntry } from '../types/control-component.type';
import { withLoadedComponent } from '../composables/loaded-component';
import { ControlContainer, FormControl, FormGroup } from '@angular/forms';
import { createBindings } from '../setup/bindings';
import { withDynamicLabel } from '../composables/dynamic-label';
import { withHiddenState } from '../composables/hidden.state';
import { NgxFbGroupDirective } from './ngx-fb-group.directive';
import { withTestId } from '../composables/testId';

@Directive({
  selector: '[ngxfbControl]',
})
export class NgxFbControlDirective {
  private viewContainerRef = inject(ViewContainerRef);
  private destroyRef = inject(DestroyRef);
  private parentContainer = inject(ControlContainer);
  private readonly contentRegistrationService = inject(
    NGX_FW_COMPONENT_RESOLVER,
  );

  private readonly parentGroupDirective: NgxFbGroupDirective<NgxFbFormGroup> | null =
    inject(NgxFbGroupDirective<NgxFbFormGroup>, {
      optional: true,
    });

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

  private readonly hideStrategy = computed(
    () => this.controlConfig().hideStrategy,
  );

  readonly parentValueStrategy = computed(() =>
    this.parentGroupDirective?.valueStrategy(),
  );

  private readonly valueStrategy: Signal<ValueStrategy | undefined> = computed(
    () => this.controlConfig().valueStrategy ?? this.parentValueStrategy(),
  );

  private readonly handleVisibility = computed(
    () => (this.registrationEntry()?.keepValueWhenHidden ?? 'auto') === 'auto',
  );

  private readonly defaultValue = computed(
    () => this.controlConfig().defaultValue,
  );

  private readonly component = withLoadedComponent(this.registrationEntry);

  private readonly isHidden = withHiddenState(this.controlConfig);

  private readonly testId = withTestId(this.controlConfig, this.controlName);

  private readonly signalMap = new Map<string, Signal<unknown>>([
    ['name', this.controlName],
    ['isHidden', this.isHidden],
    ['hideStrategy', this.hideStrategy],
    ['valueStrategy', this.valueStrategy],
    ['testId', this.testId],
    ['labelText', computed(() => this.controlConfig().label)],
    ['dynamicLabel', withDynamicLabel(this.controlConfig)],
  ]);

  /**
   * Access to the parent FormGroup containing this control
   */
  get parentFormGroup() {
    return this.parentContainer.control as FormGroup | null;
  }

  get formControl() {
    const name = this.controlName();
    if (!this.parentFormGroup?.contains(name)) {
      return null;
    }

    return this.parentFormGroup.get(name) as FormControl | null;
  }

  constructor() {
    afterRenderEffect(() => {
      const component = this.component();

      this.viewContainerRef.clear();

      if (!component || !this.parentFormGroup) {
        return;
      }

      this.instantiateComponent(component);
    });

    effect(() => {
      const isHidden = this.isHidden();

      if (isHidden) {
        this.applyHiddenState();
        return;
      }

      this.applyVisibleState();
    });

    this.destroyRef.onDestroy(() => {
      this.componentRef?.destroy();
      this.parentFormGroup?.removeControl(this.controlName(), {
        emitEvent: false,
      });
    });
  }

  private applyHiddenState() {
    const controlName = this.controlName();
    const handleVisibility = this.handleVisibility();

    if (handleVisibility) {
      this.destroyComponent();
    }
    this.removeControl(controlName, this.formControl);
  }

  private applyVisibleState() {
    const controlName = this.controlName();
    const handleVisibility = this.handleVisibility();

    if (!this.formControl) {
      this.setControl(controlName);
    }

    this.setValue();

    // untracked because changes to that signal are already handled elsewhere
    const component = untracked(() => this.component());

    if (handleVisibility && component) {
      this.instantiateComponent(component);
    }
  }

  private setValue() {
    const valueStrategy = this.valueStrategy();
    const defaultValue = this.defaultValue();
    switch (valueStrategy) {
      case 'last':
        break;
      case 'reset':
        this.formControl?.reset(undefined, { emitEvent: false });
        break;
      default:
        this.formControl?.setValue(defaultValue);
        break;
    }
  }

  private resolveInitialValue() {
    return this.controlConfig().defaultValue;
  }

  private setControl(controlName: string) {
    const controlInstance = new FormControl(this.resolveInitialValue(), {});

    this.parentFormGroup?.setControl(controlName, controlInstance, {
      emitEvent: false,
    });
  }

  private removeControl(
    controlName: string,
    formControl: FormControl | null | undefined,
  ) {
    // Check if control exists immediately before attempting removal
    if (!formControl) {
      return;
    }
    this.parentFormGroup?.removeControl(controlName, { emitEvent: false });
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

  private destroyComponent() {
    this.viewContainerRef.clear();
  }
}
