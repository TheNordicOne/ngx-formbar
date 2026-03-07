import { NgxFbControl } from '@ngx-formbar/core';

export interface DropdownControl extends NgxFbControl {
  type: 'dropdown';

  options: { id: string; value: string; label: string }[];
}
