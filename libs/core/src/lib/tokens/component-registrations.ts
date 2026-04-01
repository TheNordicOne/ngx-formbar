import { InjectionToken } from '@angular/core';
import { LoadComponentFn } from '../types/registration.type';

export const NGX_FW_COMPONENT_REGISTRATIONS = new InjectionToken<
  ReadonlyMap<string, LoadComponentFn>
>('NGX_FW_COMPONENT_REGISTRATIONS', {
  providedIn: 'root',
  factory: () => new Map(),
});
