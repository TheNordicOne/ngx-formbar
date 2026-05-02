import {
  afterRenderEffect,
  ComponentRef,
  computed,
  Directive,
  effect,
  inject,
  Injector,
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
  NgxFbBaseContent,
  NgxFbFormGroup,
  NgxFbItem,
  ValueStrategy,
} from '@ngx-formbar/core';
import { FormConfigEntry } from '../types/control-component.type';
import { withLoadedComponent } from '../composables/loaded-component';
import { ControlContainer, FormGroup } from '@angular/forms';
import { withControlState } from '../composables/control-state';
import { createBindings } from '../setup/bindings';
import { NGXFB_CONTROL_ENTRIES } from '../tokens/control-entries';
import { withDynamicTitle } from '../composables/dynamic-title';
import { withHiddenState } from '../composables/hidden.state';
import { withTestId } from '../composables/testId';
import {
  disabledEffect,
  withDisabledState,
} from '../composables/disabled.state';
import { withReadonlyState } from '../composables/readonly.state';
import { withUpdateStrategy } from '../composables/update-strategy';
import { withAsyncValidators, withValidators } from '../composables/validators';

@Directive({
  selector: '[ngxfbGroup]',
})
export class NgxFbGroupDirective<T extends NgxFbBaseContent = NgxFbItem>
  implements OnDestroy
{
  private viewContainerRef = inject(ViewContainerRef);
  private parentContainer = inject(ControlContainer);
  private readonly contentRegistrationService = inject(
    NGX_FW_COMPONENT_RESOLVER,
  );

  private readonly parentGroupDirective: NgxFbGroupDirective<NgxFbFormGroup> | null =
    inject(NgxFbGroupDirective<NgxFbFormGroup>, {
      optional: true,
      skipSelf: true,
    });

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

  private readonly groupControls = computed<FormConfigEntry<NgxFbItem>[]>(() =>
    Object.entries(this.controlConfig().controls).map(([name, config]) => ({
      name,
      config,
    })),
  );

  private readonly parentHideStrategy = computed(() =>
    this.parentGroupDirective?.hideStrategy(),
  );

  readonly hideStrategy: Signal<HideStrategy | undefined> = computed(
    () => this.controlConfig().hideStrategy ?? this.parentHideStrategy(),
  );

  private readonly keepValueWhenHidden = computed(
    () => this.hideStrategy() === 'keep',
  );

  private readonly parentValueStrategy = computed(() =>
    this.parentGroupDirective?.valueStrategy(),
  );

  readonly valueStrategy: Signal<ValueStrategy | undefined> = computed(
    () => this.controlConfig().valueStrategy ?? this.parentValueStrategy(),
  );

  private readonly handleVisibility = computed(
    () => (this.registrationEntry()?.keepValueWhenHidden ?? 'auto') === 'auto',
  );

  private readonly component = withLoadedComponent(this.registrationEntry);

  readonly isHidden = withHiddenState(this.controlConfig);

  readonly isReadonly = withReadonlyState(this.controlConfig);

  readonly isDisabled = withDisabledState(this.controlConfig);
  private readonly handleDisable = computed(
    () => (this.registrationEntry()?.disabledHandling ?? 'auto') === 'auto',
  );

  readonly updateStrategy = withUpdateStrategy(this.controlConfig);

  private readonly validators = withValidators(this.controlConfig);
  private readonly asyncValidators = withAsyncValidators(this.controlConfig);

  readonly testId = withTestId(this.controlConfig, this.controlName);

  readonly formGroupInstance = computed(
    () =>
      new FormGroup(
        {},
        {
          updateOn: this.updateStrategy(),
          validators: this.validators(),
          asyncValidators: this.asyncValidators(),
        },
      ),
  );

  private readonly groupState = withControlState(this.formGroupInstance);
  readonly errors = this.groupState.errors;
  readonly isDirty = this.groupState.isDirty;

  private readonly signalMap = new Map<string, Signal<unknown>>([
    ['name', this.controlName],
    ['isHidden', this.isHidden],
    ['isDisabled', this.isDisabled],
    ['isReadonly', this.isReadonly],
    ['hideStrategy', this.hideStrategy],
    ['valueStrategy', this.valueStrategy],
    ['testId', this.testId],
    ['titleText', computed(() => this.controlConfig().title)],
    ['dynamicTitle', withDynamicTitle(this.controlConfig)],
    ['errors', this.errors],
    ['isDirty', this.isDirty],
    ['groupInstance', this.formGroupInstance],
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

    this.removeGroup();
  }

  private applyVisibleState() {
    const handleVisibility = this.handleVisibility();

    this.setGroup();

    // untracked because changes to that signal are already handled elsewhere
    const component = untracked(() => this.component());

    if (handleVisibility && component) {
      this.instantiateComponent(component);
    }
  }

  private setValueByStrategy() {
    const valueStrategy = this.valueStrategy();

    switch (valueStrategy) {
      case 'last':
        break;
      case 'default':
        break;
      default:
        // Instead of resetting the group, we need to reset the controls individually
        // to allow them to overwrite the value strategy
        // If a control doesn't have a value strategy, we reset it
        Object.entries(this.controlConfig().controls).forEach(
          ([name, control]) => {
            if (!('valueStrategy' in control)) {
              return;
            }

            if (control.valueStrategy) {
              return;
            }
            const formControl = this.formGroupInstance().get(name);
            if (formControl) {
              formControl.reset(undefined, { emitEvent: false });
            }
          },
        );
        break;
    }
  }

  private setGroup() {
    const name = this.controlName();
    const instance = this.formGroupInstance();
    if (this.parentFormGroup?.get(name) === instance) {
      return;
    }
    this.parentFormGroup?.setControl(name, instance);
  }

  private removeGroup() {
    const name = this.controlName();
    if (!this.parentFormGroup?.get(name)) {
      return;
    }
    this.parentFormGroup.removeControl(name);
  }

  private enableControl() {
    this.formGroupInstance().enable({ emitEvent: false });
  }

  private disableControl() {
    this.formGroupInstance().disable({ emitEvent: false });
  }

  private instantiateComponent(component: Type<unknown>) {
    const bindings = createBindings(
      component,
      this.signalMap,
      this.controlConfig,
    );

    const componentInjector = Injector.create({
      providers: [
        { provide: NGXFB_CONTROL_ENTRIES, useValue: this.groupControls },
      ],
      parent: this.viewContainerRef.injector,
    });

    this.componentRef = this.viewContainerRef.createComponent(component, {
      bindings: [...bindings],
      injector: componentInjector,
    });
  }

  private destroyComponent() {
    const instance = this.componentRef;

    if (!instance) {
      return;
    }

    this.viewContainerRef.clear();
  }

  ngOnDestroy() {
    this.componentRef?.destroy();

    const keepValueWhenHidden = this.keepValueWhenHidden();
    if (keepValueWhenHidden) {
      return;
    }
    this.removeGroup();
  }
}
