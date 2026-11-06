import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

export const textForm: NgxFbForm<ExampleControls> = {
  content: {
    fullName: {
      type: 'text',
      label: 'Full Name',
      placeHolder: 'e.g., Emma Frost',
    },
  },
};
