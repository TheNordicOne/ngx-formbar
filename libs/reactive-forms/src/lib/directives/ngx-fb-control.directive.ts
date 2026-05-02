import {
  afterRenderEffect,
  computed,
  Directive,
  effect,
  inject,
  input,
  OnDestroy,
  Signal,
  untracked,
} from '@angular/core';
import { NgxFbControl, NgxFbFormGroup } from '@ngx-formbar/core';
import { FormConfigEntry } from '../types/control-component.type';
import { ControlContainer, FormControl, FormGroup } from '@angular/forms';
import { withControlState } from '../composables/control-state';
import { withDynamicLabel } from '../composables/dynamic-label';
import { withHiddenState } from '../composables/hidden.state';
import { NgxFbGroupDirective } from './ngx-fb-group.directive';
import { withTestId } from '../composables/testId';
import { FORM_LIFECYCLE_STATE } from '../services/form-lifecycle-state';
import { withDisabledLifecycle } from '../composables/disabled-lifecycle';
import { withReadonlyState } from '../composables/readonly.state';
import {
  setComputedValueEffect,
  withComputedValue,
} from '../composables/computed-value';
import { withUpdateStrategy } from '../composables/update-strategy';
import { withAsyncValidators, withValidators } from '../composables/validators';
import { withBase } from '../composables/base';
import { withComponentHost } from '../composables/component-host';
import { withInheritedValue } from '../composables/inherited-value';
import { FormService } from '../services/form.service';

@Directive({
  selector: '[ngxfbControl]',
})
export class NgxFbControlDirective implements OnDestroy {
  private parentContainer = inject(ControlContainer);
  private readonly formService = inject(FormService);
  private readonly formLifecycleState = inject(FORM_LIFECYCLE_STATE);

  private readonly parentGroupDirective: NgxFbGroupDirective<NgxFbFormGroup> | null =
    inject(NgxFbGroupDirective<NgxFbFormGroup>, {
      optional: true,
    });

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
    this.parentGroupDirective?.hideStrategy,
  );

  private readonly keepValueWhenHidden = computed(
    () => this.hideStrategy() === 'keep',
  );

  readonly valueStrategy = withInheritedValue(
    this.controlConfig,
    'valueStrategy',
    this.parentGroupDirective?.valueStrategy,
  );

  private readonly handleVisibility = computed(
    () => (this.registrationEntry()?.keepValueWhenHidden ?? 'auto') === 'auto',
  );

  private readonly defaultValue = computed(
    () => this.controlConfig().defaultValue,
  );

  private readonly isHidden = withHiddenState(this.controlConfig);

  private readonly isReadonly = withReadonlyState(this.controlConfig);

  private readonly updateStrategy = withUpdateStrategy(this.controlConfig);

  private readonly validators = withValidators(this.controlConfig);
  private readonly asyncValidators = withAsyncValidators(this.controlConfig);

  readonly controlInstance = computed(
    () =>
      new FormControl(this.resolveInitialValue(), {
        nonNullable: this.controlConfig().nonNullable,
        updateOn: this.updateStrategy(),
        validators: this.validators(),
        asyncValidators: this.asyncValidators(),
      }),
  );

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
    ['controlInstance', this.controlInstance],
  ]);

  private readonly host = withComponentHost({
    signalMap: this.signalMap,
    controlConfig: this.controlConfig,
  });

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
      const component = this.base.component();

      this.host.clear();

      if (!component || !this.parentFormGroup) {
        return;
      }

      if (untracked(() => this.isHidden())) {
        return;
      }

      this.host.mount(component);
    });

    effect(() => {
      const isHidden = this.isHidden();

      if (isHidden) {
        this.applyHiddenState();
        return;
      }

      this.applyVisibleState();
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
      this.host.clear();
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
    const component = untracked(() => this.base.component());

    if (handleVisibility && component) {
      this.host.mount(component);
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
    this.saveLastValue();
    this.setValueByStrategy();

    if (this.keepValueWhenHidden()) {
      return;
    }
    this.removeControl();
  }
}
