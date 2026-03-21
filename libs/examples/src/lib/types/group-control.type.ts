import { NgxFbFormGroup } from '@ngx-formbar/core';

export interface GroupControl extends NgxFbFormGroup {
  type: 'group';
  legend?: string;
  hideMode?: 'structural' | 'attribute';
}
