import { provideFormwork, UpdateStrategy } from '../../../lib';
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
import { TestBlockComponent } from '../../components/test-block/test-block.component';

export const formworkProviders = (updateOn?: UpdateStrategy) =>
  provideFormwork({
    componentRegistrations: {
      'test-text-control': TestTextControlComponent,
      'test-group': TestGroupComponent,
      'test-block': TestBlockComponent,
    },
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
    updateOn,
  });
