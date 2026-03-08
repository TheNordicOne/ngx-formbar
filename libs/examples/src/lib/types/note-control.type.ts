import { NgxFbBlock } from '@ngx-formbar/core';

export interface NoteControl extends NgxFbBlock {
  type: 'note';

  message: string;
  severity?: 'info' | 'warn' | 'danger';
}
