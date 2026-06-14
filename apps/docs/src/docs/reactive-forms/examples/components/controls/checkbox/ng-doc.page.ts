import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsControlsCategory from '../ng-doc.category';
import { CheckboxExampleComponent } from './checkbox-example.component';

const CheckboxPage: NgDocPage = {
  title: 'Checkbox',
  mdFile: './index.md',
  category: ReactiveFormsControlsCategory,
  order: 3,
  demos: { CheckboxExampleComponent },
};

export default CheckboxPage;
