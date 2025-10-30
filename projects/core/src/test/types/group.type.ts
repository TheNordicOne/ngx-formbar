import { NgxFbFormGroup } from '../../lib';
import { TestContent } from '../helper/test';

export interface TestGroup extends NgxFbFormGroup<TestContent> {
  type: 'test-group';
  useDefaultTestId?: boolean;
}
