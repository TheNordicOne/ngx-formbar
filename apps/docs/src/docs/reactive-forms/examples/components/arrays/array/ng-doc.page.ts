import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsArraysCategory from '../ng-doc.category';
import { ArrayExampleComponent } from './array-example.component';

const ArrayPage: NgDocPage = {
  title: 'Array',
  mdFile: './index.md',
  category: ReactiveFormsArraysCategory,
  order: 1,
  demos: { ArrayExampleComponent },
};

export default ArrayPage;
