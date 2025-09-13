import { InjectionToken, Type } from '@angular/core';

export const NgxFwComponentRegistrations = new InjectionToken<
  ReadonlyMap<string, Type<unknown>>
>('NgxFwComponentRegistrations', {
  providedIn: 'root',
  factory: () => new Map(),
});
