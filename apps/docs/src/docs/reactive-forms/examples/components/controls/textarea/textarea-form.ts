import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

export const textareaForm: NgxFbForm<ExampleControls> = {
  content: {
    description: {
      type: 'textarea',
      label: 'Description',
      placeHolder: 'Describe the issue',
      rows: 4,
      maxLength: 500,
    },
  },
};
