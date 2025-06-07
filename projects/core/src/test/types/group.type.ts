import { NgxFwFormGroup } from '../../lib';
import { TestContent } from '../helper/test';

export interface TestGroup extends NgxFwFormGroup<TestContent> {
  type: 'test-group';
  useDefaultTestId?: boolean;
}
