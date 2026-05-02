import {
  afterRenderEffect,
  ComponentRef,
  computed,
  Directive,
  effect,
  inject,
  input,
  OnDestroy,
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
  ValueStrategy,
} from '@ngx-formbar/core';
import { FormConfigEntry } from '../types/control-component.type';
import { withLoadedComponent } from '../composables/loaded-component';
import { ControlContainer, FormControl, FormGroup } from '@angular/forms';
import { withControlState } from '../composables/control-state';
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
import { withReadonlyState } from '../composables/readonly.state';
import {
  setComputedValueEffect,
  withComputedValue,
} from '../composables/computed-value';
import { withUpdateStrategy } from '../composables/update-strategy';
import { withAsyncValidators, withValidators } from '../composables/validators';
import { FormService } from '../services/form.service';

@Directive({
  selector: '[ngxfbControl]',
})
export class NgxFbControlDirective implements OnDestroy {
  private viewContainerRef = inject(ViewContainerRef);
  private parentContainer = inject(ControlContainer);
  private readonly formService = inject(FormService);
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

  private readonly isReadonly = withReadonlyState(this.controlConfig);

  private readonly isDisabled = withDisabledState(this.controlConfig);
  private readonly handleDisable = computed(
    () => (this.registrationEntry()?.disabledHandling ?? 'auto') === 'auto',
  );

  private readonly computedValue = withComputedValue(this.controlConfig);
  private readonly isComputedValueDefined = computed(
    () => this.controlConfig().computedValue !== undefined,
  );

  private readonly updateStrategy = withUpdateStrategy(this.controlConfig);

  private readonly validators = withValidators(this.controlConfig);
  private readonly asyncValidators = withAsyncValidators(this.controlConfig);

  private readonly testId = withTestId(this.controlConfig, this.controlName);

  readonly controlInstance = computed(
    () =>
      new FormControl(
        untracked(() => this.resolveInitialValue()),
        {
          nonNullable: this.controlConfig().nonNullable,
          updateOn: this.updateStrategy(),
          validators: this.validators(),
          asyncValidators: this.asyncValidators(),
        },
      ),
  );

  private readonly controlState = withControlState(this.controlInstance);
  readonly errors = this.controlState.errors;
  readonly isDirty = this.controlState.isDirty;

  private readonly signalMap = new Map<string, Signal<unknown>>([
    ['name', this.controlName],
    ['isHidden', this.isHidden],
    ['isDisabled', this.isDisabled],
    ['isReadonly', this.isReadonly],
    ['hideStrategy', this.hideStrategy],
    ['valueStrategy', this.valueStrategy],
    ['testId', this.testId],
    ['labelText', computed(() => this.controlConfig().label)],
    ['dynamicLabel', withDynamicLabel(this.controlConfig)],
    ['errors', this.errors],
    ['isDirty', this.isDirty],
  ]);

  /**
   * Access to the parent FormGroup containing this control
   */
  get parentFormGroup() {
    return this.parentContainer.control as FormGroup | null;
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

      if (untracked(() => this.isHidden())) {
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
      disabledSignal: this.isDisabled,
      handleDisableSignal: this.handleDisable,
      enableFunction: this.enableControl.bind(this),
      disableFunction: this.disableControl.bind(this),
    });

    setComputedValueEffect({
      controlInstance: this.controlInstance,
      computeValueSignal: this.computedValue,
      isComputedValueDefined: this.isComputedValueDefined,
      formResetSignal: this.formService.formReset,
    });
  }

  private applyHiddenState() {
    const handleVisibility = this.handleVisibility();
    const keepValueWhenHidden = this.keepValueWhenHidden();

    if (handleVisibility) {
      this.destroyComponent();
    }

    this.setValueByStrategy();

    if (keepValueWhenHidden) {
      return;
    }

    this.saveLastValue();
    this.removeControl();
  }

  private applyVisibleState() {
    const handleVisibility = this.handleVisibility();

    this.setControl();

    // untracked because changes to that signal are already handled elsewhere
    const component = untracked(() => this.component());

    if (handleVisibility && component) {
      this.instantiateComponent(component);
    }
  }

  private setValueByStrategy() {
    const valueStrategy = this.valueStrategy();
    const defaultValue = this.defaultValue();
    switch (valueStrategy) {
      case 'last':
        break;
      case 'reset':
        this.controlInstance().reset(undefined, { emitEvent: false });
        break;
      default:
        this.controlInstance().setValue(defaultValue);
        break;
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

  private setControl() {
    const name = this.controlName();
    const instance = this.controlInstance();
    if (this.parentFormGroup?.get(name) === instance) {
      return;
    }
    this.parentFormGroup?.setControl(name, instance);
  }

  private removeControl() {
    const name = this.controlName();
    if (!this.parentFormGroup?.get(name)) {
      return;
    }
    this.parentFormGroup.removeControl(name);
  }

  private enableControl() {
    this.controlInstance().enable({ emitEvent: false });
  }

  private disableControl() {
    this.controlInstance().disable({ emitEvent: false });
  }

  private saveLastValue() {
    if (this.valueStrategy() !== 'last') {
      return;
    }

    this.formLifecycleState.saveValue(
      this.controlPath,
      this.controlInstance().value,
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
    this.saveLastValue();
    this.setValueByStrategy();

    if (this.keepValueWhenHidden()) {
      return;
    }
    this.removeControl();
  }
}
