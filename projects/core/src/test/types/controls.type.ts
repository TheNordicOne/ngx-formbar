import { NgxFwControl } from '../../lib';

export type TestTextControl = NgxFwControl & {
  type: 'test-text-control';
  hint?: string;
  defaultValue?: string;
};

export type UnknownContent = { type: 'unknown' } & NgxFwControl;
