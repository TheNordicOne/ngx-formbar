import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

export const dateForm: NgxFbForm<ExampleControls> = {
  content: {
    preferredDate: {
      type: 'date',
      label: 'Preferred Date',
      minDate: '1900-01-01',
      maxDate: '2026-12-31',
    },
  },
};
