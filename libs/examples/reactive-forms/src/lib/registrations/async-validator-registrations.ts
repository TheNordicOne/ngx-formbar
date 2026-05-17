import { defineAsyncValidatorRegistrations } from '@ngx-formbar/reactive-forms';
import {
  approverActive,
  asyncGroupValidator,
  asyncValidator,
  emailDomainAllowed,
  roomExists,
  unitKnownAtLocation,
} from '../validation/async.validators';

export const asyncValidatorRegistrations = defineAsyncValidatorRegistrations({
  // Docs async validators
  emailDomainAllowed: [emailDomainAllowed],
  roomExists: [roomExists],
  unitKnownAtLocation: [unitKnownAtLocation],
  approverActive: [approverActive],

  // Test async validators
  async: [asyncValidator],
  'async-group': [asyncGroupValidator],
});
