import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

export const checkboxForm: NgxFbForm<ExampleControls> = {
  content: {
    agree: {
      type: 'checkbox',
      label: 'Power loss present',
    },
  },
};
