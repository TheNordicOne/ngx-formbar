import {
  ComponentRegistrationConfig,
  UpdateStrategy,
  NgxFbGlobalConfiguration,
} from '@ngx-formbar/core';
import {
  AsyncValidatorConfig,
  RegistrationRecord,
  ValidatorConfig,
} from './validation.type';

/**
 * Configuration object passed to `provideFormbar` or `defineFormbarConfig`.
 *
 * @example
 * ```ts
 * const config: FormbarConfig<SyncValidators, AsyncValidators> = {
 *   componentRegistrations: {
 *     'text-input': staticComponent(TextInputComponent),
 *     'address-group': loadComponent(() => import('./address-group.component').then(m => m.AddressGroupComponent)),
 *   },
 *   validatorRegistrations: {
 *     'min-chars': [Validators.minLength(3)],
 *     combined: ['min-chars', Validators.required, letterValidator],
 *   },
 *   asyncValidatorRegistrations: {
 *     async: [asyncValidator],
 *   },
 * };
 * ```
 */
export interface FormbarConfig<
  S extends RegistrationRecord,
  A extends RegistrationRecord,
> {
  /** Maps control type names to their component implementations (static or lazy-loaded). */
  componentRegistrations?: ComponentRegistrationConfig;
  /** Synchronous validator registrations keyed by name. */
  validatorRegistrations?: ValidatorConfig<S>;
  /** Asynchronous validator registrations keyed by name. */
  asyncValidatorRegistrations?: AsyncValidatorConfig<A>;
  /** Default update strategy (`change` | `blur` | `submit`) applied to all controls unless overridden. */
  updateOn?: UpdateStrategy;
  /** Global configuration applied to every control in the form. */
  globalConfig?: NgxFbGlobalConfiguration;
}
