import { NgxFbBaseContent, NgxFbFormGroup, NgxFbItem } from '@ngx-formbar/core';

export interface GroupControl<T extends NgxFbBaseContent = NgxFbItem>
  extends NgxFbFormGroup<T> {
  type: 'group';
  legend?: string;
}
