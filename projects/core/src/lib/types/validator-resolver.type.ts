import { Signal } from '@angular/core';
import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';

export interface ValidatorResolver {
  registrations: Signal<ReadonlyMap<string, ValidatorFn[]>>;
  asyncRegistrations: Signal<ReadonlyMap<string, AsyncValidatorFn[]>>;
}
