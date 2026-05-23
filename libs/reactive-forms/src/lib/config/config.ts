import {
  AsyncValidatorConfig,
  RegistrationRecord,
  ValidatorConfig,
} from '../types/validation.type';
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
>(config: FormbarConfig<S, A>): FormbarConfig<S, A> {
  return config;
}

/**
 * Identity helper for typing a synchronous validator registration map.
 * Returns the supplied {@link ValidatorConfig} unchanged so the inferred
 * key types stay intact for cross-referencing and downstream consumption
 * (e.g. {@link toValidatorRegistrationMap} or the
 * `NGX_FW_VALIDATOR_REGISTRATIONS` token).
 *
 * @param config The {@link ValidatorConfig} object to type-check.
 * @returns The same `config` value, with its `S` registration type
 *   preserved for downstream inference.
 */
export function defineValidatorRegistrations<S extends RegistrationRecord>(
  config: ValidatorConfig<S>,
): ValidatorConfig<S> {
  return config;
}

/**
 * Identity helper for typing an asynchronous validator registration map.
 * Returns the supplied {@link AsyncValidatorConfig} unchanged so the
 * inferred key types stay intact for cross-referencing and downstream
 * consumption (e.g. {@link toAsyncValidatorRegistrationMap} or the
 * `NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS` token).
 *
 * @param config The {@link AsyncValidatorConfig} object to type-check.
 * @returns The same `config` value, with its `A` registration type
 *   preserved for downstream inference.
 */
export function defineAsyncValidatorRegistrations<
  A extends RegistrationRecord,
>(config: AsyncValidatorConfig<A>): AsyncValidatorConfig<A> {
  return config;
}
