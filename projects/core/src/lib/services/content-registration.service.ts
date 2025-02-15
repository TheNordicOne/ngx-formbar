import {
  Injectable,
  Signal,
  signal,
  Type,
  WritableSignal,
} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ContentRegistrationService {
  private readonly _registrations: WritableSignal<Map<string, Type<unknown>>>;
  readonly registrations: Signal<Map<string, Type<unknown>>>;

  constructor(registrations: Map<string, Type<unknown>>) {
    this._registrations = signal(registrations);
    this.registrations = this._registrations.asReadonly();
  }
}
