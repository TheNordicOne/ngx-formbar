import { inject, InjectionToken } from '@angular/core';
import { AsyncValidatorFn, ValidatorFn, Validators } from '@angular/forms';

export const NGX_FW_DEFAULT_VALIDATOR_REGISTRATIONS = new InjectionToken<
  ReadonlyMap<string, ValidatorFn[]>
>('NgxFwDefaultValidatorRegistrations', {
  providedIn: 'root',
  factory: () =>
    new Map<string, ValidatorFn[]>([
      ['required', [Validators.required]],
      ['requiredTrue', [Validators.requiredTrue]],
      ['email', [Validators.email]],
      ['nullValidator', [Validators.nullValidator]],
    ]),
});

export const NGX_FW_DEFAULT_ASYNC_VALIDATOR_REGISTRATIONS = new InjectionToken<
  ReadonlyMap<string, AsyncValidatorFn[]>
>('NGX_FW_DEFAULT_ASYNC_VALIDATOR_REGISTRATIONS', {
  providedIn: 'root',
  factory: () => new Map<string, AsyncValidatorFn[]>(),
});

export const NGX_FW_VALIDATOR_REGISTRATIONS = new InjectionToken<
  ReadonlyMap<string, ValidatorFn[]>[]
>('NGX_FW_VALIDATOR_REGISTRATIONS');

export const NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS = new InjectionToken<
  ReadonlyMap<string, AsyncValidatorFn[]>[]
>('NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS');

export const NGX_FW_VALIDATOR_REGISTRATIONS_RESOLVED = new InjectionToken<
  ReadonlyMap<string, ValidatorFn[]>
>('NGX_FW_VALIDATOR_REGISTRATIONS_RESOLVED', {
  providedIn: 'root',
  factory: () => {
    const base = inject(NGX_FW_DEFAULT_VALIDATOR_REGISTRATIONS);
    const extras =
      inject(NGX_FW_VALIDATOR_REGISTRATIONS, { optional: true }) ?? [];
    return mergeMapsLastWins(base, ...extras);
  },
});

export const NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS_RESOLVED = new InjectionToken<
  ReadonlyMap<string, AsyncValidatorFn[]>
>('NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS_RESOLVED', {
  providedIn: 'root',
  factory: () => {
    const base = inject(NGX_FW_DEFAULT_ASYNC_VALIDATOR_REGISTRATIONS);
    const extras =
      inject(NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS, { optional: true }) ?? [];
    return mergeMapsLastWins(base, ...extras);
  },
});

/** Utility: merge maps left->right, later maps override earlier keys */
function mergeMapsLastWins<V>(
  ...maps: ReadonlyMap<string, V[]>[]
): ReadonlyMap<string, V[]> {
  const out = new Map<string, V[]>();
  for (const m of maps) {
    for (const [k, v] of m) {
      out.set(k, v);
    }
  }
  return out;
}
