import { EnvironmentProviders } from '@angular/core';
import { NgxFbGlobalConfiguration, UpdateStrategy } from '@ngx-formbar/core';
import { provideFormbar } from '@ngx-formbar/reactive-forms';
import { componentRegistrations } from './registrations/component-registrations';
import { validatorRegistrations } from './registrations/validator-registrations';
import { asyncValidatorRegistrations } from './registrations/async-validator-registrations';

export function provideReactiveFormsExamples(options?: {
  updateOn?: UpdateStrategy;
  globalConfig?: NgxFbGlobalConfiguration;
}): EnvironmentProviders {
  return provideFormbar({
    componentRegistrations,
    validatorRegistrations,
    asyncValidatorRegistrations,
    ...options,
  });
}
