import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsControlsCategory from '../ng-doc.category';
import { NumberExampleComponent } from './number-example.component';

const NumberPage: NgDocPage = {
  title: 'Number',
  mdFile: './index.md',
  category: ReactiveFormsControlsCategory,
  order: 2,
  demos: { NumberExampleComponent },
};

export default NumberPage;
