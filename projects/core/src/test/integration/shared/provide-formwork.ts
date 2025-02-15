import { provideFormwork } from '../../../lib';
import { TestTextControlComponent } from '../../components/test-text-control/test-text-control.component';
import { TestGroupComponent } from '../../components/test-group/test-group.component';

export const formworkProviders = provideFormwork(
  {
    type: 'test-text-control',
    component: TestTextControlComponent,
  },
  {
    type: 'test-group',
    component: TestGroupComponent,
  },
);
