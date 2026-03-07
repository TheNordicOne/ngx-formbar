import { NgxFbControl } from '@ngx-formbar/core';

export interface RadioControl extends NgxFbControl {
  type: 'radio';

  options: { id: string; value: string; label: string }[];
}
