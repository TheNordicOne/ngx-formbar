import { Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class ValidatorRegistrationService {
  private readonly _registrations: WritableSignal<Map<string, ValidatorFn[]>>;
  readonly registrations: Signal<Map<string, ValidatorFn[]>>;

  private readonly _asyncRegistrations: WritableSignal<
    Map<string, AsyncValidatorFn[]>
  >;
  readonly asyncRegistrations: Signal<Map<string, AsyncValidatorFn[]>>;

  constructor(
    registrations: Map<string, ValidatorFn[]>,
    asyncRegistrations: Map<string, AsyncValidatorFn[]>,
  ) {
    this._registrations = signal(registrations);
    this.registrations = this._registrations.asReadonly();

    this._asyncRegistrations = signal(asyncRegistrations);
    this.asyncRegistrations = this._asyncRegistrations.asReadonly();
  }
}
