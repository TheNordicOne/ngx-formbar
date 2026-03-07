import { NgxFbControl } from '@ngx-formbar/core';

export interface DateControl extends NgxFbControl {
  type: 'date';
  minDate?: string;
  maxDate?: string;
}
