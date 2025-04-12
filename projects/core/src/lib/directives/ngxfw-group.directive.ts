import {
  computed,
  Directive,
  inject,
  input,
  OnDestroy,
  signal,
  Signal,
} from '@angular/core';
import { NgxFwFormGroup, ValueStrategy } from '../types/content.type';
import { ControlContainer, FormControl, FormGroup } from '@angular/forms';
import { ComponentRegistrationService } from '../services/component-registration.service';
import { ValidatorRegistrationService } from '../services/validator-registration.service';
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

@Directive({
  selector: '[ngxfwGroup]',
  host: {
    '[attr.hidden]': 'hiddenAttribute()',
  },
})
export class NgxfwGroupDirective<T extends NgxFwFormGroup>
  implements OnDestroy
{
  private parentContainer = inject(ControlContainer);
  private readonly contentRegistrationService = inject(
    ComponentRegistrationService,
  );

  private validatorRegistrationService = inject(ValidatorRegistrationService);
  private validatorRegistrations =
    this.validatorRegistrationService.registrations;

  private asyncValidatorRegistrations =
    this.validatorRegistrationService.asyncRegistrations;

  private readonly parentGroupDirective: NgxfwGroupDirective<NgxFwFormGroup> | null =
    inject(NgxfwGroupDirective<NgxFwFormGroup>, {
      optional: true,
      skipSelf: true,
    });

  readonly content = input.required<T>();

  private readonly visibilityHandling = signal<StateHandling>('auto');
  private readonly disabledHandling = signal<StateHandling>('auto');

  readonly testId = computed(() => this.content().id);
  readonly title = computed(() => this.content().title);
  readonly controls = computed(() => this.content().controls);
  readonly registrations = this.contentRegistrationService.registrations;

  readonly hideStrategy = computed(() => this.content().hideStrategy);
  readonly valueStrategy: Signal<ValueStrategy | undefined> = computed(
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

  get parentFormGroup() {
    return this.parentContainer.control as FormGroup | null;
  }

  get formGroup() {
    return this.parentFormGroup?.get(this.content().id) as FormControl | null;
  }

  setVisibilityHandling(visibilityHandling: StateHandling) {
    this.visibilityHandling.set(visibilityHandling);
  }

  setDisabledHandling(disabledHandling: StateHandling) {
    this.disabledHandling.set(disabledHandling);
  }

  private readonly groupInstance = computed(() => {
    const content = this.content();

    const validators = this.getValidators(content);
    const asyncValidators = this.getAsyncValidators(content);

    return new FormGroup([], validators, asyncValidators);
  });

  constructor() {
    hiddenEffect({
      content: this.content,
      controlInstance: this.groupInstance,
      hiddenSignal: this.isHidden,
      hideStrategySignal: this.hideStrategy,
      valueStrategySignal: this.valueStrategy,
      parentValueStrategySignal: this.parentValueStrategy,
      attachFunction: this.setGroup.bind(this),
      detachFunction: this.removeGroup.bind(this),
      valueHandleFunction: this.handleValue.bind(this),
    });

    disabledEffect({
      disabledSignal: this.disabled,
      disabledHandlingSignal: this.disabledHandling,
      enableFunction: this.enableGroup.bind(this),
      disableFunction: this.disableGroup.bind(this),
    });
  }

  private getValidators(content: T) {
    const validatorKeys = content.validators ?? [];
    return validatorKeys.flatMap(
      (key) => this.validatorRegistrations().get(key) ?? [],
    );
  }

  private getAsyncValidators(content: T) {
    const validatorKeys = content.asyncValidators ?? [];
    return validatorKeys.flatMap(
      (key) => this.asyncValidatorRegistrations().get(key) ?? [],
    );
  }

  private setGroup() {
    this.parentFormGroup?.setControl(this.content().id, this.groupInstance(), {
      emitEvent: false,
    });
  }

  private removeGroup() {
    const id = this.content().id;
    const formGroup = this.formGroup;
    // Check if control exists immediately before attempting removal
    if (formGroup) {
      this.parentFormGroup?.removeControl(id, { emitEvent: false });
    }
  }

  private enableGroup() {
    const formGroup = this.groupInstance();

    formGroup.enable({ emitEvent: false });
  }
  private disableGroup() {
    const formGroup = this.groupInstance();

    formGroup.disable({ emitEvent: false });
  }

  private handleValue(valueStrategy?: ValueStrategy) {
    switch (valueStrategy) {
      case 'last':
        break;
      case 'default':
        break;
      default:
        // Instead of resetting  the group, we need to reset the controls individually
        // to allow them to overwrite the value strategy
        // If a control doesn't have a value strategy, we reset it
        this.content().controls.forEach((control) => {
          if (control.valueStrategy) {
            return;
          }
          const formControl = this.formGroup?.get(control.id);
          if (formControl) {
            formControl.reset(undefined, { emitEvent: false });
          }
        });
        break;
    }
  }

  ngOnDestroy(): void {
    this.removeGroup();
  }
}
