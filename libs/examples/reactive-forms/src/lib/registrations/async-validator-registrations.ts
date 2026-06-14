import { defineAsyncValidatorRegistrations } from '@ngx-formbar/reactive-forms';
import {
  approverActive,
  asyncGroupValidator,
  asyncValidator,
  emailDomainAllowed,
  roomExists,
  totalSizeUnder10mb,
  unitKnownAtLocation,
} from '../validation/async.validators';

export const asyncValidatorRegistrations = defineAsyncValidatorRegistrations({
  // Docs async validators
  emailDomainAllowed: [emailDomainAllowed],
  roomExists: [roomExists],
  unitKnownAtLocation: [unitKnownAtLocation],
  approverActive: [approverActive],

  // File async validators
  totalSizeUnder10mb: [totalSizeUnder10mb],

  // Test async validators
  async: [asyncValidator],
  'async-group': [asyncGroupValidator],
});
