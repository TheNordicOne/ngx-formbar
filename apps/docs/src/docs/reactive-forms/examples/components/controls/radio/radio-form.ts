import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

export const radioForm: NgxFbForm<ExampleControls> = {
  content: {
    urgency: {
      type: 'radio',
      label: 'Urgency',
      options: [
        { id: 'low', value: 'low', label: 'Low' },
        { id: 'high', value: 'high', label: 'High' },
      ],
    },
  },
};
