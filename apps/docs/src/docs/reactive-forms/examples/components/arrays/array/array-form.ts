import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

export const arrayForm: NgxFbForm<ExampleControls> = {
  content: {
    tags: {
      type: 'array',
      label: 'Tags',
      addLabel: 'Add tag',
      itemLabel: 'tag',
      emptyMessage: 'No tags yet.',
      rowControl: { type: 'text', label: 'Tag' },
    },
  },
};
