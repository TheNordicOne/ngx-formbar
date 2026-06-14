import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsInteractiveCategory from '../interactive/ng-doc.category';
import { VeryLargeFormDemoComponent } from './very-large-form-demo.component';

const VeryLargeFormPage: NgDocPage = {
  title: 'Very Large Form',
  mdFile: './index.md',
  category: ReactiveFormsInteractiveCategory,
  order: 7,
  demos: { VeryLargeFormDemoComponent },
};

export default VeryLargeFormPage;
