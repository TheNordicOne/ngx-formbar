import { NgxFbControl } from '@ngx-formbar/core';

export interface TextareaControl extends NgxFbControl {
  type: 'textarea';
  rows?: number;
  maxLength?: number;
  placeHolder?: string;
}
