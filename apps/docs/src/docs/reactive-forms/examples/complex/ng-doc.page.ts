import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsExamplesCategory from '../ng-doc.category';
import { ComplexDemoComponent } from './complex-demo.component';

const ComplexPage: NgDocPage = {
  title: 'Complex Form',
  mdFile: './index.md',
  category: ReactiveFormsExamplesCategory,
  order: 4,
  demos: { ComplexDemoComponent },
};

export default ComplexPage;
