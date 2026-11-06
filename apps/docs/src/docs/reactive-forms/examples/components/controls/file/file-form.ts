import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

export const fileForm: NgxFbForm<ExampleControls> = {
  content: {
    attachment: {
      type: 'file',
      label: 'Attachment',
      accept: ['.pdf', '.txt'],
    },
  },
};
