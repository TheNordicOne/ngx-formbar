import { NgxFbControl } from '@ngx-formbar/core';

export interface FileControl extends NgxFbControl {
  type: 'file';
  multiple?: boolean;
  /** e.g., ['image/*','application/pdf'] */
  accept?: string[];
}
