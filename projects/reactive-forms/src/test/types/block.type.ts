import { NgxFbBlock } from '@ngx-formbar/core';

export interface InfoBlock extends NgxFbBlock {
  message: string;
  useDefaultTestId?: boolean;
}
