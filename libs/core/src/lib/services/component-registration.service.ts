import { inject, Injectable, signal, Signal } from '@angular/core';
import { NGX_FW_COMPONENT_REGISTRATIONS } from '../tokens/component-registrations';
import { ComponentResolver } from '../types/component-resolver.type';
import { ComponentRegistrationEntry } from '../types/registration.type';

@Injectable({
  providedIn: 'root',
})
export class ComponentRegistrationService implements ComponentResolver {
  private readonly _registrations = signal(
    inject(NGX_FW_COMPONENT_REGISTRATIONS),
  );

  readonly registrations: Signal<ReadonlyMap<string, ComponentRegistrationEntry>> =
    this._registrations.asReadonly();
}
