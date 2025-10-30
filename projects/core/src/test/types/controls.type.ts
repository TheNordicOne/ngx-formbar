import { NgxFbControl } from '../../lib';

export interface TestTextControl extends NgxFbControl {
  type: 'test-text-control';
  hint?: string;
  defaultValue?: string;
  useDefaultTestId?: boolean;
}

export interface UnknownContent extends NgxFbControl {
  type: 'unknown';
}
