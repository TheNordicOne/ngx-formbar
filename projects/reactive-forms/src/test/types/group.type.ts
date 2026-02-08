import { NgxFbFormGroup } from '@ngx-formbar/core';
import { TestContent } from './content.type';

export interface TestGroup extends NgxFbFormGroup<TestContent> {
  type: 'test-group';
  useDefaultTestId?: boolean;
}
