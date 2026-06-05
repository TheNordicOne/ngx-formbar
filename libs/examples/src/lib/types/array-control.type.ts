import { NgxFbArray, NgxFbBaseContent, NgxFbItem } from '@ngx-formbar/core';

export interface ArrayControl<T extends NgxFbBaseContent = NgxFbItem>
  extends NgxFbArray<T> {
  type: 'array';
  addLabel?: string;
  itemLabel?: string;
  emptyMessage?: string;
}
