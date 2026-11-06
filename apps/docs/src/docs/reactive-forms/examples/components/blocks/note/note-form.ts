import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

export const noteForm: NgxFbForm<ExampleControls> = {
  content: {
    infoNote: {
      type: 'note',
      isControl: false,
      severity: 'info',
      message: 'An informational note rendered as a block.',
    },
  },
};
