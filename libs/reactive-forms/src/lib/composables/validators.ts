import { computed, inject, Signal } from '@angular/core';
import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { NGX_VALIDATOR_RESOLVER } from '../tokens/validator-resolver';
import { NgxFbAbstractControl } from '@ngx-formbar/core';

/**
 * Resolves the control's `validators` keys to a signal of `ValidatorFn[]`
 * using the validator registration service. Unknown keys contribute no
 * functions; missing or empty `validators` resolves to an empty array.
 *
 * @param content Signal of the control's content config. Reads the
 *   `validators` array of registration keys.
 * @returns A signal of the flattened `ValidatorFn[]` to attach to the
 *   `FormControl`/`FormGroup`.
 */
export function withValidators(
  content: Signal<NgxFbAbstractControl>,
): Signal<ValidatorFn[]> {
  const validatorRegistrations = inject(NGX_VALIDATOR_RESOLVER).registrations;

  return computed(() => {
    const validatorKeys = content().validators ?? [];
    return validatorKeys.flatMap(
      (key) => validatorRegistrations().get(key) ?? [],
    );
  });
}

/**
 * Resolves the control's `asyncValidators` keys to a signal of
 * `AsyncValidatorFn[]` using the validator registration service. Unknown
 * keys contribute no functions; missing or empty `asyncValidators` resolves
 * to an empty array.
 *
 * @param content Signal of the control's content config. Reads the
 *   `asyncValidators` array of registration keys.
 * @returns A signal of the flattened `AsyncValidatorFn[]` to attach to the
 *   `FormControl`/`FormGroup`.
 */
export function withAsyncValidators(
  content: Signal<NgxFbAbstractControl>,
): Signal<AsyncValidatorFn[]> {
  const asyncValidatorRegistrations = inject(
    NGX_VALIDATOR_RESOLVER,
  ).asyncRegistrations;
  return computed(() => {
    const validatorKeys = content().asyncValidators ?? [];
    return validatorKeys.flatMap(
      (key) => asyncValidatorRegistrations().get(key) ?? [],
    );
  });
}
