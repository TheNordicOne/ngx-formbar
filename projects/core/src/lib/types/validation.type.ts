import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';

/**
 * Base record type for validator registrations
 *
 * Represents a key-value store where keys are validator identifiers
 * and values are the validator implementations
 */
export type RegistrationRecord = Record<string, unknown>;

/**
 * Utility type that extracts string keys from a validator registration
 *
 * Used to ensure type safety when referencing validators by their string identifiers
 *
 * @template Registration - A record type containing registered validators
 */
export type ValidatorKey<Registration extends RegistrationRecord> = Extract<
  keyof Registration,
  string
>;

/**
 * Configuration for synchronous form validators
 *
 * Maps validator identifiers to arrays of validator definitions which can be:
 * - Direct validator functions (ValidatorFn)
 * - References to other validators by their string identifiers
 *
 * @template T - Record type containing registered validators
 *
 * @example
 * // Define validator configurations
 * const validatorConfig: ValidatorConfig<MyValidators> = {
 *   required: [Validators.required],
 *   email: [Validators.email],
 *   password: [Validators.minLength(8), 'required'],
 *   // Reference other validators or combine them
 *   profile: ['required', 'email', customProfileValidator]
 * };
 */
export type ValidatorConfig<T extends RegistrationRecord> = {
  [K in keyof T]: (ValidatorFn | ValidatorKey<T>)[];
};

/**
 * Configuration for asynchronous form validators
 *
 * Maps validator identifiers to arrays of async validator definitions which can be:
 * - Direct async validator functions (AsyncValidatorFn)
 * - References to other validators by their string identifiers
 *
 * @template T - Record type containing registered validators
 *
 * @example
 * // Define async validator configurations
 * const asyncValidatorConfig: AsyncValidatorConfig<MyAsyncValidators> = {
 *   uniqueEmail: [emailUniquenessValidator],
 *   serverCheck: [serverValidationFn],
 *   // Reference other validators or combine them
 *   complexCheck: ['uniqueEmail', customAsyncValidator]
 * };
 */
export type AsyncValidatorConfig<T extends RegistrationRecord> = {
  [K in keyof T]: (AsyncValidatorFn | ValidatorKey<T>)[];
};
