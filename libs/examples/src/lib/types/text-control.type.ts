import { NgxFbControl } from '@ngx-formbar/core';

export interface TextControl extends NgxFbControl {
  type: 'text';
  defaultValue?: string;

  hint?: string;
  placeHolder?: string;
  hideMode?: 'structural' | 'attribute';
}
