import { RegistrationRecord } from '../types/validation.type';
import { FormworkConfig } from '../types/provide.type';

/**
 * Type helper to make it easier to use formwork.config.ts
 * accepts a direct {@link FormworkConfig} object
 */
export function defineFormworkConfig<
  S extends RegistrationRecord,
  A extends RegistrationRecord,
>(config: FormworkConfig<S, A>) {
  return config;
}
