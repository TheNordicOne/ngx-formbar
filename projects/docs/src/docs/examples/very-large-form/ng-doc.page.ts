import { NgDocPage } from '@ng-doc/core';
import ExamplesCategory from '../ng-doc.category';
import { VeryLargeFormDemoComponent } from './very-large-form-demo.component';

const VeryLargeFormPage: NgDocPage = {
  title: 'Very Large Form',
  mdFile: './index.md',
  category: ExamplesCategory,
  order: 7,
  demos: { VeryLargeFormDemoComponent },
};

export default VeryLargeFormPage;
