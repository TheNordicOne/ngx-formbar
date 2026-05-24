import { NgxFbArray } from '@ngx-formbar/core';

export interface ArrayControl extends NgxFbArray {
  type: 'array';
  addLabel?: string;
  itemLabel?: string;
  emptyMessage?: string;
}
