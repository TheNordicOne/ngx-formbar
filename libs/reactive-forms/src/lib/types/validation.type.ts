import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';

export type RegistrationRecord = Record<string, unknown>;

export type ValidatorKey<Registration extends RegistrationRecord> = Extract<
  keyof Registration,
  string
>;

/**
 * Maps validator names to arrays of `ValidatorFn`s or references to other registered names.
 *
 * @example
 * ```ts
 * const validators: ValidatorConfig<MyValidators> = {
 *   required: [Validators.required],
 *   password: [Validators.minLength(8), 'required'],
 *   profile: ['required', 'email', customProfileValidator],
 * };
 * ```
 */
export type ValidatorConfig<T extends RegistrationRecord> = {
  [K in keyof T]: (ValidatorFn | ValidatorKey<T>)[];
};

/**
 * Maps async validator names to arrays of `AsyncValidatorFn`s or references to other registered names.
 *
 * @example
 * ```ts
 * const asyncValidators: AsyncValidatorConfig<MyAsyncValidators> = {
 *   uniqueEmail: [emailUniquenessValidator],
 *   complexCheck: ['uniqueEmail', customAsyncValidator],
 * };
 * ```
 */
export type AsyncValidatorConfig<T extends RegistrationRecord> = {
  [K in keyof T]: (AsyncValidatorFn | ValidatorKey<T>)[];
};
