import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsInteractiveCategory from '../interactive/ng-doc.category';
import { ComplexDemoComponent } from './complex-demo.component';

const ComplexPage: NgDocPage = {
  title: 'Complex Form',
  mdFile: './index.md',
  category: ReactiveFormsInteractiveCategory,
  order: 4,
  demos: { ComplexDemoComponent },
};

export default ComplexPage;
