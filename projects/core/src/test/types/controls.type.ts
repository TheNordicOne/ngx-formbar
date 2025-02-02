import { NgxFwControl } from '../../lib/features/form/types/content.type';

export type TestTextControl = NgxFwControl & {
  type: 'test-text-control';
};

export type UnknownContent = { type: 'unknown' } & NgxFwControl;
