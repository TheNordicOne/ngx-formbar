import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsInteractiveCategory from '../interactive/ng-doc.category';
import { LoadFromJsonDemoComponent } from './load-from-json-demo.component';

const LoadFromJsonPage: NgDocPage = {
  title: 'Load From JSON',
  mdFile: './index.md',
  category: ReactiveFormsInteractiveCategory,
  order: 5,
  demos: { LoadFromJsonDemoComponent },
};

export default LoadFromJsonPage;
