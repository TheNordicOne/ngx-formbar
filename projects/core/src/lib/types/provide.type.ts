import { ComponentRegistrationConfig } from './registration.type';
import {
  AsyncValidatorConfig,
  RegistrationRecord,
  ValidatorConfig,
} from './validation.type';

export type FormworkConfig<
  S extends RegistrationRecord,
  A extends RegistrationRecord,
> = {
  componentRegistrations: ComponentRegistrationConfig[];
  validatorRegistrations?: ValidatorConfig<S>;
  asyncValidatorRegistrations?: AsyncValidatorConfig<A>;
};
