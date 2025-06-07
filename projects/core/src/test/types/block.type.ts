import { NgxFwBlock } from '../../lib';

export interface InfoBlock extends NgxFwBlock {
  message: string;
  useDefaultTestId?: boolean;
}
