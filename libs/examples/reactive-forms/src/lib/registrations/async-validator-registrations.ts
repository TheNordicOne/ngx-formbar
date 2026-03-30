import { RegistrationRecord } from '@ngx-formbar/reactive-forms';
import {
  approverActive,
  asyncGroupValidator,
  asyncValidator,
  emailDomainAllowed,
  roomExists,
  unitKnownAtLocation,
} from '../validation/async.validators';
import { AsyncValidatorRegistrations } from '@ngx-formbar/examples';

export const asyncValidatorRegistrations: AsyncValidatorRegistrations<RegistrationRecord> =
  {
    // Docs async validators
    emailDomainAllowed: [emailDomainAllowed],
    roomExists: [roomExists],
    unitKnownAtLocation: [unitKnownAtLocation],
    approverActive: [approverActive],

    // Test async validators
    async: [asyncValidator],
    'async-group': [asyncGroupValidator],
  };
