import { inject, Injectable, signal } from '@angular/core';
import { NgxFwComponentRegistrations } from '../tokens/component-registrations';
import { ComponentResolver } from '../types/component-resolver.type';

@Injectable({
  providedIn: 'root',
})
export class ComponentRegistrationService implements ComponentResolver {
  private readonly _registrations = signal(inject(NgxFwComponentRegistrations));

  readonly registrations = this._registrations.asReadonly();
}
