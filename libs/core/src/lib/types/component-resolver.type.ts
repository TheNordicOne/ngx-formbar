import { Signal } from '@angular/core';
import { ComponentRegistrationEntry } from './registration.type';

export interface ComponentResolver {
  registrations: Signal<ReadonlyMap<string, ComponentRegistrationEntry>>;
}
