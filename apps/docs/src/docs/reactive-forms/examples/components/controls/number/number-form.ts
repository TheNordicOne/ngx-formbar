import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

export const numberForm: NgxFbForm<ExampleControls> = {
  content: {
    peopleAffected: {
      type: 'number',
      label: 'People Affected',
      min: 0,
      max: 5000,
    },
  },
};
