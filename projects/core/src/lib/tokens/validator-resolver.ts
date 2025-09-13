import { InjectionToken } from '@angular/core';
import { ValidatorResolver } from '../types/validator-resolver.type';

export const NgxFwValidatorResolver = new InjectionToken<ValidatorResolver>(
  'NgxFwValidatorResolver',
);
