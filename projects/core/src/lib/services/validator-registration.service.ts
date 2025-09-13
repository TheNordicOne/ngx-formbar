import { inject, Injectable, signal } from '@angular/core';
import {
  NgxFwAsyncValidatorRegistrations,
  NgxFwValidatorRegistrations,
} from '../tokens/validator-registrations';
import { ValidatorResolver } from '../types/validator-resolver.type';

@Injectable({
  providedIn: 'root',
})
export class ValidatorRegistrationService implements ValidatorResolver {
  private readonly _registrations = signal(inject(NgxFwValidatorRegistrations));
  readonly registrations = this._registrations.asReadonly();

  private readonly _asyncRegistrations = signal(
    inject(NgxFwAsyncValidatorRegistrations),
  );
  readonly asyncRegistrations = this._asyncRegistrations.asReadonly();
}
