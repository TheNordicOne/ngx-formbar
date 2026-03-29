import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsExamplesCategory from '../ng-doc.category';
import { LoadFromJsonDemoComponent } from './load-from-json-demo.component';

const LoadFromJsonPage: NgDocPage = {
  title: 'Load From JSON',
  mdFile: './index.md',
  category: ReactiveFormsExamplesCategory,
  order: 5,
  demos: { LoadFromJsonDemoComponent },
};

export default LoadFromJsonPage;
