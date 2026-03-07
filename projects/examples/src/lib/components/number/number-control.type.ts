import { NgxFbControl } from '@ngx-formbar/core';

export interface NumberControl extends NgxFbControl {
  type: 'number';

  min: number;
  max?: number;
}
