import { NgxFbBlock } from '../../lib';

export interface InfoBlock extends NgxFbBlock {
  message: string;
  useDefaultTestId?: boolean;
}
