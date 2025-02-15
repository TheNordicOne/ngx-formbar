import { NgxFwControl } from '../../lib/types/content.type';

export type TestTextControl = NgxFwControl & {
  type: 'test-text-control';
  hint?: string;
  value?: string;
  defaultValue?: string;
};

export type UnknownContent = { type: 'unknown' } & NgxFwControl;
