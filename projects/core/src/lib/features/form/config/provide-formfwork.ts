import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  Type,
} from '@angular/core';
import { RegistrationConfig } from '../types/registration.type';
import { ContentRegistrationService } from '../services/content-registration.service';

export function provideFormwork(
  ...registrationConfigs: RegistrationConfig[]
): EnvironmentProviders {
  const registrations = new Map<string, Type<unknown>>();

  registrationConfigs.forEach((reg) => {
    registrations.set(reg.type, reg.component);
  });

  return makeEnvironmentProviders([
    {
      provide: ContentRegistrationService,
      useValue: new ContentRegistrationService(registrations),
    },
  ]);
}
