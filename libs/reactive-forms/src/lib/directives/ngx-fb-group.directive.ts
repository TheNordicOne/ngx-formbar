import {
  computed,
  Directive,
  inject,
  input,
  OnDestroy,
  Signal,
} from '@angular/core';
import {
  FormConfigEntry,
  HideStrategy,
  NGX_FW_PARENT_CONTEXT,
  NgxFbBaseContent,
  NgxFbFormGroup,
  NgxFbItem,
  NgxFwParentContext,
  toSignalMap,
  ValueStrategy,
  withBase,
  withComponentHost,
  withDynamicTitle,
  withHiddenState,
  withInheritedValue,
  withReadonlyState,
  withTestId,
  withUpdateStrategy,
} from '@ngx-formbar/core';
import { ReactiveFormbarGroup } from '../types/control-component.type';
import { withFormParent } from '../composables/form-parent';
import { FormGroup } from '@angular/forms';
import { withControlState } from '../composables/control-state';
import { NGXFB_CONTROL_ENTRIES } from '../tokens/control-entries';
import { withBindMode } from '../composables/bind-mode';
import { withHiddenLifecycle } from '../composables/hidden-lifecycle';
import { withDisabledLifecycle } from '../composables/disabled-lifecycle';
import { withAsyncValidators, withValidators } from '../composables/validators';

@Directive({
  selector: '[ngxfbGroup]',
  providers: [
    { provide: NGX_FW_PARENT_CONTEXT, useExisting: NgxFbGroupDirective },
  ],
})
export class NgxFbGroupDirective<T extends NgxFbBaseContent = NgxFbItem>
  implements OnDestroy, NgxFwParentContext
{
  private readonly parent = withFormParent();

  private readonly parentContext = inject<NgxFwParentContext | null>(
    NGX_FW_PARENT_CONTEXT,
    {
      optional: true,
      skipSelf: true,
    },
  );

  readonly config = input.required<FormConfigEntry<NgxFbFormGroup<T>>>({
    alias: 'ngxfbGroup',
  });

  private readonly base = withBase(this.config);
  private readonly controlConfig = this.base.controlConfig;
  private readonly controlName = this.base.controlName;
  private readonly registrationEntry = this.base.registrationEntry;

  private readonly groupControls = computed<FormConfigEntry<NgxFbItem>[]>(() =>
    Object.entries(this.controlConfig().controls).map(([name, config]) => ({
      name,
      config,
    })),
  );

  readonly hideStrategy: Signal<HideStrategy | undefined> = withInheritedValue(
    this.controlConfig,
    'hideStrategy',
    this.parentContext?.hideStrategy,
  );

  private readonly keepFormValue = computed(
    () => this.hideStrategy() === 'keep',
  );

  readonly valueStrategy: Signal<ValueStrategy | undefined> =
    withInheritedValue(
      this.controlConfig,
      'valueStrategy',
      this.parentContext?.valueStrategy,
    );

  private readonly handleVisibility = computed(
    () => (this.registrationEntry()?.hiddenHandling ?? 'auto') === 'auto',
  );

  readonly isHidden = withHiddenState(this.controlConfig);

  readonly isReadonly = withReadonlyState(this.controlConfig);

  readonly updateStrategy = withUpdateStrategy(this.controlConfig);

  private readonly validators = withValidators(this.controlConfig);
  private readonly asyncValidators = withAsyncValidators(this.controlConfig);

  private readonly createdInstance = computed(
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

  // A row top lives directly in a FormArray: adopt the existing group built by
  // the row factory and never attach/detach by name (the FormArray owns it).
  private readonly bind = withBindMode({
    parent: this.parent,
    controlName: this.controlName,
    createdInstance: this.createdInstance,
    isInstance: (control): control is FormGroup => control instanceof FormGroup,
  });

  readonly formGroupInstance = this.bind.instance;

  readonly isDisabled = withDisabledLifecycle({
    controlConfig: this.controlConfig,
    registrationEntry: this.registrationEntry,
    instance: this.formGroupInstance,
  });

  private readonly groupState = withControlState(this.formGroupInstance);
  readonly errors = this.groupState.errors;
  readonly isDirty = this.groupState.isDirty;

  readonly testId = withTestId(this.controlConfig, this.controlName);

  private readonly signalMap = toSignalMap<ReactiveFormbarGroup>({
    name: this.controlName,
    isHidden: this.isHidden,
    isDisabled: this.isDisabled,
    isReadonly: this.isReadonly,
    hideStrategy: this.hideStrategy,
    valueStrategy: this.valueStrategy,
    testId: this.testId,
    titleText: computed(() => this.controlConfig().title),
    dynamicTitle: withDynamicTitle(this.controlConfig),
    errors: this.errors,
    isDirty: this.isDirty,
    groupInstance: this.formGroupInstance,
  });

  private readonly host = withComponentHost({
    signalMap: this.signalMap,
    controlConfig: this.controlConfig,
    additionalProviders: [
      { provide: NGXFB_CONTROL_ENTRIES, useValue: this.groupControls },
    ],
  });

  private readonly lifecycle = withHiddenLifecycle({
    component: this.base.component,
    isHidden: this.isHidden,
    host: this.host,
    parentControl: () => this.parent.control,
    controlName: this.controlName,
    instance: this.formGroupInstance,
    handleVisibility: this.handleVisibility,
    keepFormValue: this.keepFormValue,
    applyValueStrategy: this.setValueByStrategy.bind(this),
    attach: () => !this.bind.isRowTop(),
  });

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

  ngOnDestroy(): void {
    // In bind mode the directive never owns its instance (a row top is owned by
    // the FormArray; a nested row group is discarded with its row), so it must
    // not detach on destroy.
    if (this.bind.bindMode) {
      return;
    }
    if (this.keepFormValue()) {
      return;
    }
    this.lifecycle.removeControl();
  }
}
