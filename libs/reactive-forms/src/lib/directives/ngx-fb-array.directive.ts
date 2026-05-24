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
  NgxFbArray,
  NgxFbBaseContent,
  NgxFbItem,
  NgxFwParentContext,
  toSignalMap,
  ValueStrategy,
  withBase,
  withComponentHost,
  withDynamicLabel,
  withHiddenState,
  withInheritedValue,
  withReadonlyState,
  withTestId,
  withUpdateStrategy,
} from '@ngx-formbar/core';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { ReactiveFormbarArray } from '../types/control-component.type';
import { withFormParent } from '../composables/form-parent';
import { withControlState } from '../composables/control-state';
import { NGXFB_CONTROL_ENTRIES } from '../tokens/control-entries';
import { withHiddenLifecycle } from '../composables/hidden-lifecycle';
import { withDisabledLifecycle } from '../composables/disabled-lifecycle';
import { withAsyncValidators, withValidators } from '../composables/validators';

@Directive({
  selector: '[ngxfbArray]',
  providers: [
    { provide: NGX_FW_PARENT_CONTEXT, useExisting: NgxFbArrayDirective },
  ],
})
export class NgxFbArrayDirective<T extends NgxFbBaseContent = NgxFbItem>
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

  readonly config = input.required<FormConfigEntry<NgxFbArray<T>>>({
    alias: 'ngxfbArray',
  });

  private readonly base = withBase(this.config);
  private readonly controlConfig = this.base.controlConfig;
  private readonly controlName = this.base.controlName;
  private readonly registrationEntry = this.base.registrationEntry;

  private readonly rowEntries = computed<FormConfigEntry<NgxFbItem>[]>(() =>
    Object.entries(this.controlConfig().rowControls).map(([name, config]) => ({
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

  readonly formArrayInstance = computed(
    () =>
      new FormArray<AbstractControl>([], {
        updateOn: this.updateStrategy(),
        validators: this.validators(),
        asyncValidators: this.asyncValidators(),
      }),
  );

  private readonly itemFactory = computed(
    () => (): AbstractControl => new FormGroup({}),
  );

  readonly isDisabled = withDisabledLifecycle({
    controlConfig: this.controlConfig,
    registrationEntry: this.registrationEntry,
    instance: this.formArrayInstance,
  });

  private readonly arrayState = withControlState(this.formArrayInstance);
  readonly errors = this.arrayState.errors;
  readonly isDirty = this.arrayState.isDirty;

  readonly testId = withTestId(this.controlConfig, this.controlName);

  private readonly signalMap = toSignalMap<ReactiveFormbarArray>({
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
    arrayInstance: this.formArrayInstance,
    itemFactory: this.itemFactory,
  });

  private readonly host = withComponentHost({
    signalMap: this.signalMap,
    controlConfig: this.controlConfig,
    additionalProviders: [
      { provide: NGXFB_CONTROL_ENTRIES, useValue: this.rowEntries },
    ],
  });

  private get parentFormGroup(): FormGroup | null {
    return this.parent.formGroup;
  }

  private readonly lifecycle = withHiddenLifecycle({
    component: this.base.component,
    isHidden: this.isHidden,
    host: this.host,
    parentFormGroup: () => this.parentFormGroup,
    controlName: this.controlName,
    instance: this.formArrayInstance,
    handleVisibility: this.handleVisibility,
    keepFormValue: this.keepFormValue,
    applyValueStrategy: this.setValueByStrategy.bind(this),
  });

  ngOnDestroy(): void {
    if (this.keepFormValue()) {
      return;
    }
    this.lifecycle.removeControl();
  }

  private setValueByStrategy(): void {
    // Per-row controls inside the array manage their own value strategies on
    // show/hide. The array does not touch its row count here.
  }
}
