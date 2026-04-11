import { Signal } from '@angular/core';
import { ComponentRegistrationEntry } from '@ngx-formbar/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { from, of, switchMap } from 'rxjs';

export function withLoadedComponent(
  registrationEntry: Signal<ComponentRegistrationEntry | null>,
) {
  const $registrationEntry = toObservable(registrationEntry);
  const $component = $registrationEntry.pipe(
    switchMap((entry) => {
      if (!entry) {
        return of(null);
      }
      if ('component' in entry) {
        return of(entry.component);
      }
      return from(entry.loadComponent());
    }),
  );

  return toSignal($component, { initialValue: null });
}
