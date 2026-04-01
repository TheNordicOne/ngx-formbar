import { Signal } from '@angular/core';
import { LoadComponentFn } from './registration.type';

export interface ComponentResolver {
  registrations: Signal<ReadonlyMap<string, LoadComponentFn>>;
}
