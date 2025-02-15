import { NgxFwControl } from '../../lib/types/content.type';

export type TestTextControl = NgxFwControl & {
  type: 'test-text-control';
};

export type UnknownContent = { type: 'unknown' } & NgxFwControl;
