import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

export const groupForm: NgxFbForm<ExampleControls> = {
  content: {
    address: {
      type: 'group',
      legend: 'Address',
      controls: {
        street: { type: 'text', label: 'Street' },
        city: { type: 'text', label: 'City' },
      },
    },
  },
};
