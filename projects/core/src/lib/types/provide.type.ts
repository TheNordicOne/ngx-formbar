import { ComponentRegistrationConfig } from './registration.type';
import {
  AsyncValidatorConfig,
  RegistrationRecord,
  ValidatorConfig,
} from './validation.type';
import { UpdateStrategy } from './content.type';

/**
 * Configuration for registering and providing components and validators in Ngx Formwork
 *
 * @template S - Type extending RegistrationRecord for synchronous validators
 * @template A - Type extending RegistrationRecord for asynchronous validators
 *
 * @property componentRegistrations - Array of component configurations to register
 * @property validatorRegistrations - Optional configuration for synchronous validators
 * @property asyncValidatorRegistrations - Optional configuration for asynchronous validators
 *
 * @example
 * // Define custom form components and validators
 * const formworkConfig: FormworkConfig<SyncValidators, AsyncValidators> = {
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
export interface FormworkConfig<
  S extends RegistrationRecord,
  A extends RegistrationRecord,
> {
  componentRegistrations: ComponentRegistrationConfig;
  validatorRegistrations?: ValidatorConfig<S>;
  asyncValidatorRegistrations?: AsyncValidatorConfig<A>;
  updateOn?: UpdateStrategy;
}
