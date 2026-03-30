import { Validators } from '@angular/forms';
import { RegistrationRecord } from '@ngx-formbar/reactive-forms';
import {
  alnumDash,
  circuitPattern,
  floorPattern,
  forbiddenLetterAValidator,
  integer,
  isoDate,
  letterValidator,
  min0,
  minLen,
  noDuplicateValuesValidator,
  range1to10,
  range1to480,
  requiredWhenCritical,
  requiredWhenCriticalOrNeeded,
  requiredWhenVisible,
} from '../validation/sync.validators';
import { ValidatorRegistrations } from '@ngx-formbar/examples';

export const validatorRegistrations: ValidatorRegistrations<RegistrationRecord> =
  {
    // Built-ins / direct aliases
    required: [Validators.required],
    requiredTrue: [Validators.requiredTrue],
    email: [Validators.email],

    // Length
    min2Characters: [minLen(2)],
    min20Characters: [minLen(20)],

    // Numeric
    integer: [integer],
    min0: [min0],
    range1to10: [range1to10],
    range1to480: [range1to480],

    // Patterns / formats
    floorPattern: [floorPattern],
    alnumDash: [alnumDash],
    circuitPattern: [circuitPattern],
    isoDate: [isoDate],

    // Conditional requireds
    requiredWhenVisible: [requiredWhenVisible],
    requiredWhenCritical: [requiredWhenCritical],
    requiredWhenCriticalOrNeeded: [requiredWhenCriticalOrNeeded],

    // Test validators
    'min-chars': [Validators.minLength(3)],
    letter: [letterValidator],
    combined: ['min-chars', Validators.required, 'letter'],
    'no-duplicates': [noDuplicateValuesValidator],
    'forbidden-letter-a': [forbiddenLetterAValidator],
  };
