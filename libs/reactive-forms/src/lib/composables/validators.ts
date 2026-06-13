import { computed, inject, Signal } from '@angular/core';
import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { NGX_VALIDATOR_RESOLVER } from '../tokens/validator-resolver';
import { ValidatorResolver } from '../types/validator-resolver.type';
import { NgxFbAbstractControl } from '@ngx-formbar/core';

/**
 * Flattens a list of sync validator registration keys to their
 * `ValidatorFn[]` using the resolver's current registrations. Unknown or
 * missing keys contribute nothing.
 */
export function resolveValidators(
  keys: string[] | undefined,
  resolver: ValidatorResolver,
): ValidatorFn[] {
  const registrations = resolver.registrations();
  return (keys ?? []).flatMap((key) => registrations.get(key) ?? []);
}

/**
 * Flattens a list of async validator registration keys to their
 * `AsyncValidatorFn[]` using the resolver's current registrations. Unknown
 * or missing keys contribute nothing.
 */
export function resolveAsyncValidators(
  keys: string[] | undefined,
  resolver: ValidatorResolver,
): AsyncValidatorFn[] {
  const registrations = resolver.asyncRegistrations();
  return (keys ?? []).flatMap((key) => registrations.get(key) ?? []);
}

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
  const resolver = inject(NGX_VALIDATOR_RESOLVER);

  return computed(() => resolveValidators(content().validators, resolver));
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
  const resolver = inject(NGX_VALIDATOR_RESOLVER);

  return computed(() =>
    resolveAsyncValidators(content().asyncValidators, resolver),
  );
}
