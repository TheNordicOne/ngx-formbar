import { computed, inject, Signal } from '@angular/core';
import { NgxFwContent } from '../types/content.type';
import { ValidatorRegistrationService } from '../services/validator-registration.service';

/**
 * Computes a reactive array of validators based on control content
 *
 * Extracts validator keys from content and maps them to actual validator functions
 * by looking them up in the validator registration service.
 *
 * @param content Signal containing control configuration with validator keys
 * @returns Computed signal that resolves to an array of validator functions
 */
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

/**
 * Computes a reactive array of async validators based on control content
 *
 * Extracts async validator keys from content and maps them to actual async validator
 * functions by looking them up in the validator registration service.
 *
 * @param content Signal containing control configuration with async validator keys
 * @returns Computed signal that resolves to an array of async validator functions
 */
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
