import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';

export type RegistrationRecord = Record<string, unknown>;

export type ValidatorKey<Registration extends RegistrationRecord> = Extract<
  keyof Registration,
  string
>;

// Synchronous validators
export type ValidatorConfig<T extends RegistrationRecord> = {
  [K in keyof T]: (ValidatorFn | ValidatorKey<T>)[];
};

// Asynchronous validators
export type AsyncValidatorConfig<T extends RegistrationRecord> = {
  [K in keyof T]: (AsyncValidatorFn | ValidatorKey<T>)[];
};
