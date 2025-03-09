import { provideFormwork } from '../../../lib';
import { TestTextControlComponent } from '../../components/test-text-control/test-text-control.component';
import { TestGroupComponent } from '../../components/test-group/test-group.component';
import { Validators } from '@angular/forms';
import {
  asyncGroupValidator,
  asyncValidator,
  forbiddenLetterAValidator,
  letterValidator,
  noDuplicateValuesValidator,
} from '../../validator/test.validator';

export const formworkProviders = provideFormwork({
  componentRegistrations: [
    {
      type: 'test-text-control',
      component: TestTextControlComponent,
    },
    {
      type: 'test-group',
      component: TestGroupComponent,
    },
  ],
  validatorRegistrations: {
    'min-chars': [Validators.minLength(3)],
    letter: [letterValidator],
    combined: ['min-chars', Validators.required, 'letter'],
    'no-duplicates': [noDuplicateValuesValidator],
    'forbidden-letter-a': [forbiddenLetterAValidator],
  },
  asyncValidatorRegistrations: {
    async: [asyncValidator],
    'async-group': [asyncGroupValidator],
  },
});
