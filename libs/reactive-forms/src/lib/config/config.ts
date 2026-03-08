import { RegistrationRecord } from '../types/validation.type';
import { FormbarConfig } from '../types/provide.type';

/**
 * Type helper to make it easier to use formbar.config.ts
 * accepts a direct {@link FormbarConfig} object
 */
export function defineFormbarConfig<
  S extends RegistrationRecord,
  A extends RegistrationRecord,
>(config: FormbarConfig<S, A>) {
  return config;
}
