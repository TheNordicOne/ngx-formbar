import {
  afterRenderEffect,
  ComponentRef,
  computed,
  Directive,
  effect,
  inject,
  input,
  OnDestroy,
  signal,
  Signal,
  Type,
  untracked,
  ViewContainerRef,
} from '@angular/core';
import {
  HideStrategy,
  NGX_FW_COMPONENT_RESOLVER,
  NgxFbControl,
  NgxFbFormGroup,
  StateHandling,
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
import { FORM_LIFECYCLE_STATE } from '../services/form-lifecycle-state';
import {
  disabledEffect,
  withDisabledState,
} from '../composables/disabled.state';

@Directive({
  selector: '[ngxfbControl]',
})
export class NgxFbControlDirective implements OnDestroy {
  private viewContainerRef = inject(ViewContainerRef);
  private parentContainer = inject(ControlContainer);
  private readonly formLifecycleState = inject(FORM_LIFECYCLE_STATE);
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

  private readonly parentHideStrategy = computed<HideStrategy | undefined>(() =>
    this.parentGroupDirective?.hideStrategy(),
  );

  readonly hideStrategy: Signal<HideStrategy | undefined> = computed<
    HideStrategy | undefined
  >(() => this.controlConfig().hideStrategy ?? this.parentHideStrategy());

  private readonly keepValueWhenHidden = computed(
    () => this.hideStrategy() === 'keep',
  );

  readonly parentValueStrategy = computed(() =>
    this.parentGroupDirective?.valueStrategy(),
  );

  readonly valueStrategy: Signal<ValueStrategy | undefined> = computed(
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

  private readonly disabled = withDisabledState(this.controlConfig);
  private readonly disabledHandling = signal<StateHandling>('auto');

  private readonly testId = withTestId(this.controlConfig, this.controlName);

  private readonly signalMap = new Map<string, Signal<unknown>>([
    ['name', this.controlName],
    ['isHidden', this.isHidden],
    ['isDisabled', this.disabled],
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
    return this.parentFormGroup?.get(this.controlName()) as FormControl | null;
  }

  private get controlPath(): string {
    return [...(this.parentContainer.path ?? []), this.controlName()].join('.');
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

    disabledEffect({
      disabledSignal: this.disabled,
      disabledHandlingSignal: this.disabledHandling,
      enableFunction: this.enableControl.bind(this),
      disableFunction: this.disableControl.bind(this),
    });
  }

  private applyHiddenState() {
    const handleVisibility = this.handleVisibility();
    const keepValueWhenHidden = this.keepValueWhenHidden();

    if (handleVisibility) {
      this.destroyComponent();
    }

    this.setValue();

    if (keepValueWhenHidden) {
      return;
    }

    this.saveLastValue();
    this.removeControl();
  }

  private applyVisibleState() {
    const controlName = this.controlName();
    const handleVisibility = this.handleVisibility();

    if (!this.formControl) {
      this.setControl(controlName);
    }

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
      default: {
        this.formControl?.setValue(defaultValue);
        break;
      }
    }
  }

  private resolveInitialValue() {
    const valueStrategy = this.valueStrategy();

    switch (valueStrategy) {
      case 'last': {
        const hasSaved = this.formLifecycleState.hasSavedValue(
          this.controlPath,
        )();

        if (!hasSaved) {
          return this.controlConfig().defaultValue;
        }
        return this.formLifecycleState.getSavedValue(this.controlPath)();
      }
      case 'reset':
        return undefined;
      default:
        return this.controlConfig().defaultValue;
    }
  }

  private setControl(controlName: string) {
    const controlInstance = new FormControl(this.resolveInitialValue(), {});

    this.parentFormGroup?.setControl(controlName, controlInstance, {
      emitEvent: false,
    });
  }

  private removeControl() {
    const controlName = this.controlName();
    // Check if control exists immediately before attempting removal
    if (!this.formControl) {
      return;
    }
    this.parentFormGroup?.removeControl(controlName, { emitEvent: false });
  }

  private enableControl() {
    this.formControl?.enable({ emitEvent: false });
  }

  private disableControl() {
    this.formControl?.disable({ emitEvent: false });
  }

  private saveLastValue() {
    if (this.valueStrategy() !== 'last') {
      return;
    }

    this.formLifecycleState.saveValue(
      this.controlPath,
      this.formControl?.value,
    );
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

  ngOnDestroy(): void {
    this.componentRef?.destroy();
    const control = this.formControl;
    if (control) {
      this.saveLastValue();
    }

    this.setValue();

    if (this.keepValueWhenHidden() || !control) {
      return;
    }
    this.removeControl();
  }
}
