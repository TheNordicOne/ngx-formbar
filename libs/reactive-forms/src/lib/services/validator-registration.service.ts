import { inject, Injectable, signal, Signal } from '@angular/core';
import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import {
  NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS_RESOLVED,
  NGX_FW_VALIDATOR_REGISTRATIONS_RESOLVED,
} from '../tokens/validator-registrations';
import { ValidatorResolver } from '../types/validator-resolver.type';

@Injectable({
  providedIn: 'root',
})
export class ValidatorRegistrationService implements ValidatorResolver {
  private readonly _registrations = signal(
    inject(NGX_FW_VALIDATOR_REGISTRATIONS_RESOLVED),
  );
  readonly registrations: Signal<ReadonlyMap<string, ValidatorFn[]>> =
    this._registrations.asReadonly();

  private readonly _asyncRegistrations = signal(
    inject(NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS_RESOLVED),
  );
  readonly asyncRegistrations: Signal<ReadonlyMap<string, AsyncValidatorFn[]>> =
    this._asyncRegistrations.asReadonly();
}
