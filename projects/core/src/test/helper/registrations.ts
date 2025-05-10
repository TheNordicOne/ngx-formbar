import { TestTextControlComponent } from '../components/test-text-control/test-text-control.component';
import { TestGroupComponent } from '../components/test-group/test-group.component';
import { TestBlockComponent } from '../components/test-block/test-block.component';
import { ComponentRegistrationConfig } from '../../lib';
import {
  AsyncValidatorConfig,
  RegistrationRecord,
  ValidatorConfig,
} from '../../lib/types/validation.type';
import { Validators } from '@angular/forms';
import {
  asyncGroupValidator,
  asyncValidator,
  forbiddenLetterAValidator,
  letterValidator,
  noDuplicateValuesValidator,
} from '../validator/test.validator';

export const componentRegistrations: ComponentRegistrationConfig = {
  'test-text-control': TestTextControlComponent,
  'test-group': TestGroupComponent,
  'test-block': TestBlockComponent,
};

export const validatorRegistrations: ValidatorConfig<RegistrationRecord> = {
  'min-chars': [Validators.minLength(3)],
  letter: [letterValidator],
  combined: ['min-chars', Validators.required, 'letter'],
  'no-duplicates': [noDuplicateValuesValidator],
  'forbidden-letter-a': [forbiddenLetterAValidator],
};

export const asyncValidatorRegistrations: AsyncValidatorConfig<RegistrationRecord> =
  {
    async: [asyncValidator],
    'async-group': [asyncGroupValidator],
  };
