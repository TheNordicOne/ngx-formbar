import {
  computed,
  Directive,
  inject,
  input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NgxFwFormGroup } from '../types/content.type';
import { ControlContainer, FormControl, FormGroup } from '@angular/forms';
import { ComponentRegistrationService } from '../services/component-registration.service';
import { ValidatorRegistrationService } from '../services/validator-registration.service';

@Directive({
  selector: '[ngxfwGroup]',
})
export class NgxfwGroupDirective<T extends NgxFwFormGroup>
  implements OnInit, OnDestroy
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

  readonly content = input.required<T>();
  readonly testId = computed(() => this.content().id);
  readonly title = computed(() => this.content().title);
  readonly controls = computed(() => this.content().controls);
  readonly registrations = this.contentRegistrationService.registrations;

  get parentFormGroup() {
    return this.parentContainer.control as FormGroup | null;
  }

  get group() {
    return this.parentFormGroup?.get(this.content().id) as FormControl | null;
  }

  ngOnInit(): void {
    const content = this.content();
    const validators = this.getValidators(content);
    const asyncValidators = this.getAsyncValidators(content);

    this.parentFormGroup?.addControl(
      this.content().id,
      new FormGroup([], validators, asyncValidators),
      {
        emitEvent: false,
      },
    );
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
