import { inject, Injectable, signal } from '@angular/core';
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
  readonly registrations = this._registrations.asReadonly();

  private readonly _asyncRegistrations = signal(
    inject(NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS_RESOLVED),
  );
  readonly asyncRegistrations = this._asyncRegistrations.asReadonly();
}
