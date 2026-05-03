import {
  computed,
  Directive,
  inject,
  input,
  OnDestroy,
  Signal,
  untracked,
} from '@angular/core';
import {
  FormConfigEntry,
  HideStrategy,
  NgxFbBaseContent,
  NgxFbFormGroup,
  NgxFbItem,
  toSignalMap,
  ValueStrategy,
  withBase,
  withComponentHost,
  withInheritedValue,
} from '@ngx-formbar/core';
import { ReactiveFormbarGroup } from '../types/control-component.type';
import { withFormParent } from '../composables/form-parent';
import { FormGroup } from '@angular/forms';
import { withControlState } from '../composables/control-state';
import { NGXFB_CONTROL_ENTRIES } from '../tokens/control-entries';
import { withDynamicTitle } from '../composables/dynamic-title';
import { hiddenEffects, withHiddenState } from '../composables/hidden.state';
import { withTestId } from '../composables/testId';
import { withDisabledLifecycle } from '../composables/disabled-lifecycle';
import { withReadonlyState } from '../composables/readonly.state';
import { withUpdateStrategy } from '../composables/update-strategy';
import { withAsyncValidators, withValidators } from '../composables/validators';

@Directive({
  selector: '[ngxfbGroup]',
})
export class NgxFbGroupDirective<T extends NgxFbBaseContent = NgxFbItem>
  implements OnDestroy
{
  private readonly parent = withFormParent();

  private readonly parentGroupDirective: NgxFbGroupDirective<NgxFbFormGroup> | null =
    inject(NgxFbGroupDirective<NgxFbFormGroup>, {
      optional: true,
      skipSelf: true,
    });

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
    this.parentGroupDirective?.hideStrategy,
  );

  private readonly keepFormValue = computed(
    () => this.hideStrategy() === 'keep',
  );

  readonly valueStrategy: Signal<ValueStrategy | undefined> =
    withInheritedValue(
      this.controlConfig,
      'valueStrategy',
      this.parentGroupDirective?.valueStrategy,
    );

  private readonly handleVisibility = computed(
    () => (this.registrationEntry()?.hiddenHandling ?? 'auto') === 'auto',
  );

  readonly isHidden = withHiddenState(this.controlConfig);

  readonly isReadonly = withReadonlyState(this.controlConfig);

  readonly updateStrategy = withUpdateStrategy(this.controlConfig);

  private readonly validators = withValidators(this.controlConfig);
  private readonly asyncValidators = withAsyncValidators(this.controlConfig);

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

  private get parentFormGroup() {
    return this.parent.formGroup;
  }

  constructor() {
    hiddenEffects({
      component: this.base.component,
      isHidden: this.isHidden,
      parentFormGroup: () => this.parentFormGroup,
      host: this.host,
      onHidden: this.applyHiddenState.bind(this),
      onVisible: this.applyVisibleState.bind(this),
    });
  }

  private applyHiddenState() {
    const handleVisibility = this.handleVisibility();
    const keepFormValue = this.keepFormValue();

    if (handleVisibility) {
      this.host.clear();
    }

    this.setValueByStrategy();

    if (keepFormValue) {
      return;
    }

    this.removeGroup();
  }

  private applyVisibleState() {
    const handleVisibility = this.handleVisibility();

    this.setGroup();

    // untracked because changes to that signal are already handled elsewhere
    const component = untracked(() => this.base.component());

    if (handleVisibility && component) {
      this.host.mount(component);
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

  ngOnDestroy() {
    const keepFormValue = this.keepFormValue();
    if (keepFormValue) {
      return;
    }
    this.removeGroup();
  }
}
