import { inject, InjectionToken } from '@angular/core';
import { NgxFbGlobalConfiguration } from '../types/global-configuration.type';

export const NGX_FW_DEFAULT_CONFIG =
  new InjectionToken<NgxFbGlobalConfiguration>('NGX_FW_DEFAULT_CONFIG', {
    providedIn: 'root',
    factory: () => ({}) as NgxFbGlobalConfiguration,
  });

export const NGX_FW_CONFIG = new InjectionToken<
  readonly Partial<NgxFbGlobalConfiguration>[]
>('NGX_FW_CONFIG', {
  providedIn: 'root',
  factory: () => [],
});

export const NGX_FW_CONFIG_RESOLVED =
  new InjectionToken<NgxFbGlobalConfiguration>('NGX_FW_CONFIG_RESOLVED', {
    providedIn: 'root',
    factory: () => {
      const base = inject(NGX_FW_DEFAULT_CONFIG);
      const extras = inject(NGX_FW_CONFIG, { optional: true }) ?? [];
      return mergeDeep(base, ...extras);
    },
  });

function mergeDeep<T>(base: T, ...partials: readonly Partial<T>[]): T {
  const out = { ...base };
  for (const p of partials) {
    for (const k of Object.keys(p) as (keyof T)[]) {
      const src = (p as unknown as Record<keyof T, unknown>)[k];
      const dst = (out as unknown as Record<keyof T, unknown>)[k];

      const bothObjects =
        typeof dst === 'object' &&
        dst !== null &&
        typeof src === 'object' &&
        src !== null &&
        !Array.isArray(dst) &&
        !Array.isArray(src);

      if (bothObjects) {
        (out as unknown as Record<keyof T, unknown>)[k] = mergeDeep(
          dst as unknown as T,
          src as Partial<T>,
        );
        continue;
      }
      (out as unknown as Record<keyof T, unknown>)[k] = src;
    }
  }
  return out;
}
