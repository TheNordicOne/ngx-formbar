import { NgxFbControl } from '@ngx-formbar/core';

export interface ManualTextControl extends NgxFbControl {
  type: 'manual-text';
  defaultValue?: string;
}
