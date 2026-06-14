import { Validators } from '@angular/forms';
import { defineValidatorRegistrations } from '@ngx-formbar/reactive-forms';
import {
  alnumDash,
  circuitPattern,
  floorPattern,
  forbiddenLetterAValidator,
  imagesOrPdf,
  integer,
  isoDate,
  letterValidator,
  maxFiles5,
  min0,
  minLen,
  minRows,
  noDuplicateValuesValidator,
  range1to10,
  range1to480,
  requiredWhenCritical,
  requiredWhenCriticalOrNeeded,
  requiredWhenVisible,
} from '../validation/sync.validators';

export const validatorRegistrations = defineValidatorRegistrations({
  // Built-ins / direct aliases
  required: [Validators.required],
  requiredTrue: [Validators.requiredTrue],
  email: [Validators.email],

  // Length
  min2Characters: [minLen(2)],
  min20Characters: [minLen(20)],
  minLength5: [minLen(5)],

  // Numeric
  integer: [integer],
  min0: [min0],
  min1: [Validators.min(1)],
  max100: [Validators.max(100)],
  range1to10: [range1to10],
  range1to480: [range1to480],

  // Files
  maxFiles5: [maxFiles5],
  imagesOrPdf: [imagesOrPdf],

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
  'min-rows': [minRows(2)],
});
