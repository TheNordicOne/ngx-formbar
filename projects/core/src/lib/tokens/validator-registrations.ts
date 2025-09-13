import { InjectionToken } from '@angular/core';
import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';

export const NgxFwValidatorRegistrations = new InjectionToken<
  ReadonlyMap<string, ValidatorFn[]>
>('NgxFwValidatorRegistrations', {
  providedIn: 'root',
  factory: () => new Map(),
});

export const NgxFwAsyncValidatorRegistrations = new InjectionToken<
  ReadonlyMap<string, AsyncValidatorFn[]>
>('NgxFwAsyncValidatorRegistrations', {
  providedIn: 'root',
  factory: () => new Map(),
});
