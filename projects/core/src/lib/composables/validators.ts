import { computed, inject, Signal } from '@angular/core';
import { NgxFwContent } from '../types/content.type';
import { ValidatorRegistrationService } from '../services/validator-registration.service';

export function withValidators(content: Signal<NgxFwContent>) {
  const validatorRegistrations = inject(
    ValidatorRegistrationService,
  ).registrations;
  return computed(() => {
    const validatorKeys = content().validators ?? [];
    return validatorKeys.flatMap(
      (key) => validatorRegistrations().get(key) ?? [],
    );
  });
}

export function withAsyncValidators(content: Signal<NgxFwContent>) {
  const asyncValidatorRegistrations = inject(
    ValidatorRegistrationService,
  ).asyncRegistrations;
  return computed(() => {
    const validatorKeys = content().asyncValidators ?? [];
    return validatorKeys.flatMap(
      (key) => asyncValidatorRegistrations().get(key) ?? [],
    );
  });
}
