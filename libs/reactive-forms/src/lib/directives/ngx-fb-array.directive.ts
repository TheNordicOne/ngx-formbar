import {
  computed,
  Directive,
  inject,
  input,
  OnDestroy,
  Signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
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
import { AbstractControl, FormArray } from '@angular/forms';
import { ReactiveFormbarArray } from '../types/control-component.type';
import { withFormParent } from '../composables/form-parent';
import { withControlState } from '../composables/control-state';
import {
  NGXFB_ARRAY_CONTROL,
  NgxFbArrayContext,
} from '../tokens/control-entries';
import { withHiddenLifecycle } from '../composables/hidden-lifecycle';
import { withDisabledLifecycle } from '../composables/disabled-lifecycle';
import { withAsyncValidators, withValidators } from '../composables/validators';
import { RowFactoryService } from '../services/row-factory.service';
import { NGXFB_PARENT_OWNED_CONTROL } from '../tokens/parent-owned-control';
import { withParentOwnedControl } from '../composables/parent-owned-control';

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
  private readonly rowFactory = inject(RowFactoryService);

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

  private readonly rowEntries = computed<T>(
    () => this.controlConfig().rowControl,
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
      new FormArray<AbstractControl>([], {
        updateOn: this.updateStrategy(),
        validators: this.validators(),
        asyncValidators: this.asyncValidators(),
      }),
  );

  private readonly ownership = withParentOwnedControl({
    parent: this.parent,
    controlName: this.controlName,
    createdInstance: this.createdInstance,
    controlType: FormArray,
  });

  readonly formArrayInstance = this.ownership.instance;

  private readonly arrayChanges = toSignal(
    toObservable(this.formArrayInstance).pipe(
      switchMap((array) => array.valueChanges),
    ),
    { initialValue: null },
  );

  private readonly rows = computed<AbstractControl[]>(() => {
    this.arrayChanges();
    return [...this.formArrayInstance().controls];
  });

  private insertRow(index: number): void {
    this.formArrayInstance().insert(
      index,
      this.rowFactory.build(this.rowEntries()),
    );
  }

  private readonly arrayContext: NgxFbArrayContext = {
    rowControl: this.rowEntries,
    rows: this.rows,
    add: () => {
      this.insertRow(this.formArrayInstance().length);
    },
    insertAt: (index: number) => {
      this.insertRow(index);
    },
    removeAt: (index: number) => {
      this.formArrayInstance().removeAt(index);
    },
    move: (from: number, to: number) => {
      const array = this.formArrayInstance();
      const count = array.length;
      if (from === to || from < 0 || from >= count || to < 0 || to >= count) {
        return;
      }
      // Re-insert the same control instance so the row keeps its identity
      // (and its cached last-value) across the move.
      const row = array.at(from);
      array.removeAt(from);
      array.insert(to, row);
    },
  };

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
  });

  private readonly host = withComponentHost({
    signalMap: this.signalMap,
    controlConfig: this.controlConfig,
    additionalProviders: [
      { provide: NGXFB_ARRAY_CONTROL, useValue: this.arrayContext },
      { provide: NGXFB_PARENT_OWNED_CONTROL, useValue: true },
    ],
  });

  private readonly lifecycle = withHiddenLifecycle({
    component: this.base.component,
    isHidden: this.isHidden,
    host: this.host,
    parentControl: () => this.parent.control,
    controlName: this.controlName,
    instance: this.formArrayInstance,
    handleVisibility: this.handleVisibility,
    keepFormValue: this.keepFormValue,
    applyValueStrategy: this.setValueByStrategy.bind(this),
    skipControlRegistration: this.ownership.isDirectFormArrayChild,
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
