import { inject, Injectable, signal } from '@angular/core';
import { NGX_FW_COMPONENT_REGISTRATIONS } from '../tokens/component-registrations';
import { ComponentResolver } from '../types/component-resolver.type';

@Injectable({
  providedIn: 'root',
})
export class ComponentRegistrationService implements ComponentResolver {
  private readonly _registrations = signal(
    inject(NGX_FW_COMPONENT_REGISTRATIONS),
  );

  readonly registrations = this._registrations.asReadonly();
}
