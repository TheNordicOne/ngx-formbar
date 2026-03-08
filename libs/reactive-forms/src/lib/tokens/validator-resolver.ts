import { InjectionToken } from '@angular/core';
import { ValidatorResolver } from '../types/validator-resolver.type';

export const NGX_VALIDATOR_RESOLVER = new InjectionToken<ValidatorResolver>(
  'NGX_VALIDATOR_RESOLVER',
);
