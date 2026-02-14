import { AsyncValidatorFn } from '@angular/forms';
import {
  AsyncValidatorConfig,
  NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
  RegistrationRecord,
} from '@ngx-formbar/reactive-forms';
import {
  approverActive,
  emailDomainAllowed,
  roomExists,
  unitKnownAtLocation,
} from '../validation/async.validators';

// Config-based registration (for use with defineFormbarConfig / provideFormbar)
export const asyncValidatorRegistrations: AsyncValidatorConfig<RegistrationRecord> =
  {
    emailDomainAllowed: [emailDomainAllowed],
    roomExists: [roomExists],
    unitKnownAtLocation: [unitKnownAtLocation],
    approverActive: [approverActive],
  };

// Token-based registration (for use as a provider)
export const asyncValidatorRegistrationsProvider = {
  provide: NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
  useValue: new Map<string, AsyncValidatorFn[]>([
    ['emailDomainAllowed', [emailDomainAllowed]],
    ['roomExists', [roomExists]],
    ['unitKnownAtLocation', [unitKnownAtLocation]],
    ['approverActive', [approverActive]],
  ]),
};
