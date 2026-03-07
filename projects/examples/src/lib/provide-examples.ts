import {
  NgxFbGlobalConfiguration,
  UpdateStrategy,
} from '@ngx-formbar/core';
import { provideFormbar } from '@ngx-formbar/reactive-forms';
import { componentRegistrations } from './registrations/component-registrations';
import { validatorRegistrations } from './registrations/validator-registrations';
import { asyncValidatorRegistrations } from './registrations/async-validator-registrations';

export function provideExamples(options?: {
  updateOn?: UpdateStrategy;
  globalConfig?: NgxFbGlobalConfiguration;
}) {
  return provideFormbar({
    componentRegistrations,
    validatorRegistrations,
    asyncValidatorRegistrations,
    ...options,
  });
}
