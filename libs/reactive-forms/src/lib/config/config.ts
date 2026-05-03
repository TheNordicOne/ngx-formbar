import { RegistrationRecord } from '../types/validation.type';
import { FormbarConfig } from '../types/provide.type';

/**
 * Identity helper for typing a `formbar.config.ts` module. Returns the
 * supplied {@link FormbarConfig} unchanged so the file can be imported by
 * tooling (schematics, scripts) and by `provideFormbar` without losing the
 * inferred validator and async-validator key types.
 *
 * @param config The {@link FormbarConfig} object to type-check.
 * @returns The same `config` value, with its `S`/`A` registration types
 *   preserved for downstream inference.
 */
export function defineFormbarConfig<
  S extends RegistrationRecord,
  A extends RegistrationRecord,
>(config: FormbarConfig<S, A>) {
  return config;
}
