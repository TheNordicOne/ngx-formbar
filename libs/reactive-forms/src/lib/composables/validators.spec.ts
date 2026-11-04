import { signal } from '@angular/core';
import { AsyncValidatorFn, ValidatorFn, Validators } from '@angular/forms';
import { resolveAsyncValidators, resolveValidators } from './validators';

const asyncValidator: AsyncValidatorFn = () => Promise.resolve(null);
const resolver = {
  registrations: signal(
    new Map<string, ValidatorFn[]>([['required', [Validators.required]]]),
  ),
  asyncRegistrations: signal(
    new Map<string, AsyncValidatorFn[]>([['unique', [asyncValidator]]]),
  ),
};

describe('validator resolving', () => {
  it('flattens the registered validators', () => {
    expect(resolveValidators(['required'], resolver)).toEqual([
      Validators.required,
    ]);
    expect(resolveAsyncValidators(['unique'], resolver)).toEqual([
      asyncValidator,
    ]);
  });

  it('skips unknown keys', () => {
    expect(resolveValidators(['missing'], resolver)).toEqual([]);
    expect(resolveAsyncValidators(['missing'], resolver)).toEqual([]);
  });

  it('gives nothing without keys', () => {
    expect(resolveValidators(undefined, resolver)).toEqual([]);
    expect(resolveAsyncValidators(undefined, resolver)).toEqual([]);
  });
});
