import { InjectionToken } from '@angular/core';
import { ComponentRegistrationEntry } from '../types/registration.type';

export const NGX_FW_COMPONENT_REGISTRATIONS = new InjectionToken<
  ReadonlyMap<string, ComponentRegistrationEntry>
>('NGX_FW_COMPONENT_REGISTRATIONS', {
  providedIn: 'root',
  factory: () => new Map(),
});
