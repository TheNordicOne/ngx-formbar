import { Signal, Type } from '@angular/core';

export interface ComponentResolver {
  registrations: Signal<ReadonlyMap<string, Type<unknown>>>;
}
