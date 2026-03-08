import { InjectionToken, Type } from '@angular/core';

export const NGX_FW_COMPONENT_REGISTRATIONS = new InjectionToken<
  ReadonlyMap<string, Type<unknown>>
>('NGX_FW_COMPONENT_REGISTRATIONS', {
  providedIn: 'root',
  factory: () => new Map(),
});
