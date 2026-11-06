import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

export const dropdownForm: NgxFbForm<ExampleControls> = {
  content: {
    country: {
      type: 'dropdown',
      label: 'Country',
      options: [
        { id: 'us', value: 'us', label: 'United States' },
        { id: 'uk', value: 'uk', label: 'United Kingdom' },
        { id: 'de', value: 'de', label: 'Germany' },
      ],
    },
  },
};
