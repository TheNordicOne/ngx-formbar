import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { RegistrationRecord, ValidatorKey } from '@ngx-formbar/reactive-forms';

export interface ValidatorRegistrations<T extends RegistrationRecord> {
  // Built-ins / direct aliases
  required: (ValidatorFn | ValidatorKey<T>)[];
  requiredTrue: (ValidatorFn | ValidatorKey<T>)[];
  email: (ValidatorFn | ValidatorKey<T>)[];

  // Length
  min2Characters: (ValidatorFn | ValidatorKey<T>)[];
  min20Characters: (ValidatorFn | ValidatorKey<T>)[];

  // Numeric
  integer: (ValidatorFn | ValidatorKey<T>)[];
  min0: (ValidatorFn | ValidatorKey<T>)[];
  range1to10: (ValidatorFn | ValidatorKey<T>)[];
  range1to480: (ValidatorFn | ValidatorKey<T>)[];

  // Patterns / formats
  floorPattern: (ValidatorFn | ValidatorKey<T>)[];
  alnumDash: (ValidatorFn | ValidatorKey<T>)[];
  circuitPattern: (ValidatorFn | ValidatorKey<T>)[];
  isoDate: (ValidatorFn | ValidatorKey<T>)[];

  // Conditional requireds
  requiredWhenVisible: (ValidatorFn | ValidatorKey<T>)[];
  requiredWhenCritical: (ValidatorFn | ValidatorKey<T>)[];
  requiredWhenCriticalOrNeeded: (ValidatorFn | ValidatorKey<T>)[];

  // Test validators
  'min-chars': (ValidatorFn | ValidatorKey<T>)[];
  letter: (ValidatorFn | ValidatorKey<T>)[];
  combined: (ValidatorFn | ValidatorKey<T>)[];
  'no-duplicates': (ValidatorFn | ValidatorKey<T>)[];
  'forbidden-letter-a': (ValidatorFn | ValidatorKey<T>)[];
  [key: string]: (ValidatorFn | ValidatorKey<T>)[];
}

export interface AsyncValidatorRegistrations<T extends RegistrationRecord> {
  emailDomainAllowed: (AsyncValidatorFn | ValidatorKey<T>)[];
  roomExists: (AsyncValidatorFn | ValidatorKey<T>)[];
  unitKnownAtLocation: (AsyncValidatorFn | ValidatorKey<T>)[];
  approverActive: (AsyncValidatorFn | ValidatorKey<T>)[];

  // Test async validators
  async: (AsyncValidatorFn | ValidatorKey<T>)[];
  'async-group': (AsyncValidatorFn | ValidatorKey<T>)[];
  [key: string]: (AsyncValidatorFn | ValidatorKey<T>)[];
}
