import {
  computed,
  Directive,
  effect,
  inject,
  input,
  OnDestroy,
} from '@angular/core';
import { NgxFwControl } from '../types/content.type';
import { ControlContainer, FormControl, FormGroup } from '@angular/forms';
import { ValidatorRegistrationService } from '../services/validator-registration.service';

@Directive({
  selector: '[ngxfwControl]',
})
export class NgxfwControlDirective<T extends NgxFwControl>
  implements OnDestroy
{
  private parentContainer = inject(ControlContainer);
  private validatorRegistrationService = inject(ValidatorRegistrationService);
  private validatorRegistrations =
    this.validatorRegistrationService.registrations;

  private asyncValidatorRegistrations =
    this.validatorRegistrationService.asyncRegistrations;

  readonly content = input.required<T>();
  readonly testId = computed(() => this.content().id);

  get parentFormGroup() {
    return this.parentContainer.control as FormGroup | null;
  }

  get control() {
    return this.parentFormGroup?.get(this.content().id) as FormControl | null;
  }

  constructor() {
    effect(() => {
      const content = this.content();
      this.parentFormGroup?.removeControl(content.id);

      const validators = this.getValidators(content);
      const asyncValidators = this.getAsyncValidators(content);
      const formControl = new FormControl(content.defaultValue, {
        nonNullable: content.nonNullable,
        validators,
        asyncValidators,
      });

      this.parentFormGroup?.addControl(this.content().id, formControl, {
        emitEvent: false,
      });
    });
  }

  ngOnDestroy(): void {
    this.parentFormGroup?.removeControl(this.content().id);
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
}
