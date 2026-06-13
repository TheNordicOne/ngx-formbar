import { computed, Directive, inject, input, OnDestroy } from '@angular/core';
import {
  FormConfigEntry,
  NGX_FW_PARENT_CONTEXT,
  NgxFbControl,
  NgxFwParentContext,
  toSignalMap,
  withBase,
  withComponentHost,
  withComputedValue,
  withDynamicLabel,
  withHiddenState,
  withInheritedValue,
  withReadonlyState,
  withTestId,
  withUpdateStrategy,
} from '@ngx-formbar/core';
import { ReactiveFormbarControl } from '../types/control-component.type';
import { FormControl } from '@angular/forms';
import { ROW_IDENTITY } from '../services/row-identity';
import { withParentOwnedControl } from '../composables/parent-owned-control';
import { withControlState } from '../composables/control-state';
import { withHiddenLifecycle } from '../composables/hidden-lifecycle';
import { FORM_LIFECYCLE_STATE } from '../services/form-lifecycle-state';
import { withDisabledLifecycle } from '../composables/disabled-lifecycle';
import { setComputedValueEffect } from '../composables/computed-value';
import { withAsyncValidators, withValidators } from '../composables/validators';
import { withFormParent } from '../composables/form-parent';
import { FormService } from '../services/form.service';

@Directive({
  selector: '[ngxfbControl]',
})
export class NgxFbControlDirective implements OnDestroy {
  private readonly parent = withFormParent();
  private readonly formService = inject(FormService);
  private readonly formLifecycleState = inject(FORM_LIFECYCLE_STATE);
  private readonly rowIdentity = inject(ROW_IDENTITY);

  private readonly parentContext = inject<NgxFwParentContext | null>(
    NGX_FW_PARENT_CONTEXT,
    { optional: true },
  );

  readonly config = input.required<FormConfigEntry<NgxFbControl>>({
    alias: 'ngxfbControl',
  });

  private readonly base = withBase(this.config);
  private readonly controlConfig = this.base.controlConfig;
  private readonly controlName = this.base.controlName;
  private readonly registrationEntry = this.base.registrationEntry;

  readonly hideStrategy = withInheritedValue(
    this.controlConfig,
    'hideStrategy',
    this.parentContext?.hideStrategy,
  );

  private readonly keepFormValue = computed(
    () => this.hideStrategy() === 'keep',
  );

  readonly valueStrategy = withInheritedValue(
    this.controlConfig,
    'valueStrategy',
    this.parentContext?.valueStrategy,
  );

  private readonly handleVisibility = computed(
    () => (this.registrationEntry()?.hiddenHandling ?? 'auto') === 'auto',
  );

  private readonly defaultValue = computed(
    () => this.controlConfig().defaultValue,
  );

  private readonly isHidden = withHiddenState(this.controlConfig);

  private readonly isReadonly = withReadonlyState(this.controlConfig);

  private readonly updateStrategy = withUpdateStrategy(this.controlConfig);

  private readonly validators = withValidators(this.controlConfig);
  private readonly asyncValidators = withAsyncValidators(this.controlConfig);

  private readonly createdInstance = computed(
    () =>
      new FormControl(this.resolveInitialValue(), {
        nonNullable: this.controlConfig().nonNullable,
        updateOn: this.updateStrategy(),
        validators: this.validators(),
        asyncValidators: this.asyncValidators(),
      }),
  );

  private readonly ownership = withParentOwnedControl({
    parent: this.parent,
    controlName: this.controlName,
    createdInstance: this.createdInstance,
    isInstance: (control): control is FormControl =>
      control instanceof FormControl,
  });

  readonly controlInstance = this.ownership.instance;

  private readonly isDisabled = withDisabledLifecycle({
    controlConfig: this.controlConfig,
    registrationEntry: this.registrationEntry,
    instance: this.controlInstance,
  });

  private readonly controlState = withControlState(this.controlInstance);
  readonly errors = this.controlState.errors;
  readonly isDirty = this.controlState.isDirty;

  private readonly computedValue = withComputedValue(this.controlConfig);
  private readonly isComputedValueDefined = computed(
    () => this.controlConfig().computedValue !== undefined,
  );

  private readonly testId = withTestId(this.controlConfig, this.controlName);

  private readonly signalMap = toSignalMap<ReactiveFormbarControl>({
    name: this.controlName,
    isHidden: this.isHidden,
    isDisabled: this.isDisabled,
    isReadonly: this.isReadonly,
    hideStrategy: this.hideStrategy,
    valueStrategy: this.valueStrategy,
    testId: this.testId,
    labelText: computed(() => this.controlConfig().label),
    dynamicLabel: withDynamicLabel(this.controlConfig),
    errors: this.errors,
    isDirty: this.isDirty,
    controlInstance: this.controlInstance,
  });

  private readonly host = withComponentHost({
    signalMap: this.signalMap,
    controlConfig: this.controlConfig,
  });

  private get controlPath(): string {
    // Rewrite any array-index segment to a stable row id so the last-value
    // cache survives insert/remove/reorder of rows.
    return this.rowIdentity.stablePath(
      this.formService.formGroup,
      this.parent.pathTo(this.controlName()),
    );
  }

  private readonly lifecycle = withHiddenLifecycle({
    component: this.base.component,
    isHidden: this.isHidden,
    host: this.host,
    parentControl: () => this.parent.control,
    controlName: this.controlName,
    instance: this.controlInstance,
    handleVisibility: this.handleVisibility,
    keepFormValue: this.keepFormValue,
    applyValueStrategy: this.setValueByStrategy.bind(this),
    beforeDetach: this.saveLastValue.bind(this),
    attach: () => !this.ownership.isRowTop(),
  });

  constructor() {
    setComputedValueEffect({
      controlInstance: this.controlInstance,
      computeValueSignal: this.computedValue,
      isComputedValueDefined: this.isComputedValueDefined,
      formResetSignal: this.formService.formReset,
    });
  }

  private setValueByStrategy() {
    const instance = this.controlInstance();
    const valueStrategy = this.valueStrategy();
    const defaultValue = this.defaultValue();
    switch (valueStrategy) {
      case 'last':
        break;
      case 'reset':
        instance.reset(undefined, { emitEvent: false });
        break;
      default:
        instance.setValue(defaultValue);
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

  private saveLastValue() {
    if (this.valueStrategy() !== 'last') {
      return;
    }

    this.formLifecycleState.saveValue(
      this.controlPath,
      this.controlInstance().value,
    );
  }

  ngOnDestroy(): void {
    if (this.ownership.isParentOwned) {
      return;
    }

    this.saveLastValue();
    this.setValueByStrategy();

    if (this.keepFormValue()) {
      return;
    }
    this.lifecycle.removeControl();
  }
}
