import {
  computed,
  Directive,
  inject,
  input,
  OnDestroy,
  signal,
} from '@angular/core';
import {
  NgxFwControl,
  NgxFwFormGroup,
  ValueStrategy,
} from '../types/content.type';
import { ControlContainer, FormControl, FormGroup } from '@angular/forms';
import { NgxfwGroupDirective } from './ngxfw-group.directive';
import { StateHandling } from '../types/registration.type';
import {
  disabledEffect,
  withDisabledState,
} from '../composables/disabled.state';
import { withReadonlyState } from '../composables/readonly.state';
import {
  hiddenEffect,
  withHiddenAttribute,
  withHiddenState,
} from '../composables/hidden.state';
import { withAsyncValidators, withValidators } from '../composables/validators';

@Directive({
  selector: '[ngxfwControl]',
  host: {
    '[attr.hidden]': 'hiddenAttribute()',
  },
})
export class NgxfwControlDirective<T extends NgxFwControl>
  implements OnDestroy
{
  private parentContainer = inject(ControlContainer);

  private readonly parentGroupDirective: NgxfwGroupDirective<NgxFwFormGroup> | null =
    inject(NgxfwGroupDirective<NgxFwFormGroup>, {
      optional: true,
    });

  readonly content = input.required<T>();

  private readonly visibilityHandling = signal<StateHandling>('auto');
  private readonly disabledHandling = signal<StateHandling>('auto');

  readonly testId = computed(() => this.content().id);

  readonly hideStrategy = computed(() => this.content().hideStrategy);
  readonly valueStrategy = computed(
    () => this.content().valueStrategy ?? this.parentValueStrategy(),
  );
  readonly parentValueStrategy = computed(() =>
    this.parentGroupDirective?.valueStrategy(),
  );

  readonly isHidden = withHiddenState(this.content);
  readonly hiddenAttribute = withHiddenAttribute({
    hiddenSignal: this.isHidden,
    hiddenHandlingSignal: this.visibilityHandling,
  });

  readonly disabled = withDisabledState(this.content);
  readonly readonly = withReadonlyState(this.content);

  readonly validators = withValidators(this.content);
  readonly asyncValidators = withAsyncValidators(this.content);

  private readonly controlInstance = computed(() => {
    const content = this.content();

    const validators = this.validators();
    const asyncValidators = this.asyncValidators();
    return new FormControl(content.defaultValue, {
      nonNullable: content.nonNullable,
      validators,
      asyncValidators,
    });
  });

  get parentFormGroup() {
    return this.parentContainer.control as FormGroup | null;
  }

  get formControl() {
    const id = this.content().id;
    if (!this.parentFormGroup?.contains(id)) {
      return null;
    }

    return this.parentFormGroup.get(id) as FormControl | null;
  }

  constructor() {
    hiddenEffect({
      content: this.content,
      controlInstance: this.controlInstance,
      hiddenSignal: this.isHidden,
      hideStrategySignal: this.hideStrategy,
      valueStrategySignal: this.valueStrategy,
      parentValueStrategySignal: this.parentValueStrategy,
      attachFunction: this.setControl.bind(this),
      detachFunction: this.removeControl.bind(this),
      valueHandleFunction: this.handleValue.bind(this),
    });

    disabledEffect({
      disabledSignal: this.disabled,
      disabledHandlingSignal: this.disabledHandling,
      enableFunction: this.enableControl.bind(this),
      disableFunction: this.disableControl.bind(this),
    });
  }

  setVisibilityHandling(visibilityHandling: StateHandling) {
    this.visibilityHandling.set(visibilityHandling);
  }

  setDisabledHandling(disabledHandling: StateHandling) {
    this.disabledHandling.set(disabledHandling);
  }

  private setControl() {
    this.parentFormGroup?.setControl(
      this.content().id,
      this.controlInstance(),
      {
        emitEvent: false,
      },
    );
  }

  private removeControl() {
    const id = this.content().id;
    const formControl = this.formControl;
    // Check if control exists immediately before attempting removal
    if (formControl) {
      this.parentFormGroup?.removeControl(id, { emitEvent: false });
    }
  }

  private enableControl() {
    const formControl = this.controlInstance();
    formControl.enable({ emitEvent: false });
  }
  private disableControl() {
    const formControl = this.controlInstance();

    formControl.disable({ emitEvent: false });
  }

  private handleValue(valueStrategy?: ValueStrategy) {
    switch (valueStrategy) {
      case 'last':
        break;
      case 'reset':
        this.controlInstance().reset(undefined, { emitEvent: false });
        break;
      default:
        this.controlInstance().setValue(this.content().defaultValue);
        break;
    }
  }

  ngOnDestroy(): void {
    this.removeControl();
  }
}
