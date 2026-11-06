import { NgxFbForm } from '@ngx-formbar/core';
import { LayoutField } from '../layout-field/layout-field.component';

export const layoutForm: NgxFbForm<LayoutField> = {
  content: {
    fullName: {
      type: 'field',
      label: 'Full Name',
      placeHolder: 'e.g., Emma Frost',
    },
    email: { type: 'field', label: 'Email', placeHolder: 'name@example.com' },
    building: { type: 'field', label: 'Building', placeHolder: 'A' },
    floor: { type: 'field', label: 'Floor', placeHolder: 'B1, G, 1, 2, …' },
    room: { type: 'field', label: 'Room / Area', placeHolder: 'e.g., A-310' },
    category: {
      type: 'field',
      label: 'Category',
      placeHolder: 'e.g., Plumbing',
    },
  },
};
