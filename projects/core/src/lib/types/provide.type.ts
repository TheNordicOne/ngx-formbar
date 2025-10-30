import { ComponentRegistrationConfig } from './registration.type';
import {
  AsyncValidatorConfig,
  RegistrationRecord,
  ValidatorConfig,
} from './validation.type';
import { UpdateStrategy } from './content.type';
import { NgxFbGlobalConfiguration } from './global-configuration.type';

/**
 * Configuration for registering and providing components and validators in Ngx Formbar
 *
 * @template S - Type extending RegistrationRecord for synchronous validators
 * @template A - Type extending RegistrationRecord for asynchronous validators
 *
 * @property componentRegistrations - Optional mapping of control types to component implementations
 * @property validatorRegistrations - Optional configuration for synchronous validators
 * @property asyncValidatorRegistrations - Optional configuration for asynchronous validators
 * @property updateOn - (Optional) Specifies when to update the control's value
 * @property globalConfig - (Optional) Configuration that is used for all controls
 *
 * @example
 * // Define custom form components and validators
 * const formbarConfig: FormbarConfig<SyncValidators, AsyncValidators> = {
 *   componentRegistrations:
 *   {
 *      'text-input': TextInputComponent
 *      'address-group': AddressGroupComponent
 *   },
 *   validatorRegistrations: {
 *      'min-chars': [Validators.minLength(3)],
 *       letter: [letterValidator],
 *       combined: ['min-chars', Validators.required, 'letter'],
 *   }
 *   asyncValidatorRegistrations: {
 *     async: [asyncValidator],
 *     'async-group': [asyncGroupValidator],
 *   },
 * };
 */
export interface FormbarConfig<
  S extends RegistrationRecord,
  A extends RegistrationRecord,
> {
  componentRegistrations?: ComponentRegistrationConfig;
  validatorRegistrations?: ValidatorConfig<S>;
  asyncValidatorRegistrations?: AsyncValidatorConfig<A>;
  updateOn?: UpdateStrategy;
  globalConfig?: NgxFbGlobalConfiguration;
}
