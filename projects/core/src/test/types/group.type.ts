import { NgxFwFormGroup } from '../../lib';

export interface TestGroup extends NgxFwFormGroup {
  type: 'test-group';
  useDefaultTestId?: boolean;
}
