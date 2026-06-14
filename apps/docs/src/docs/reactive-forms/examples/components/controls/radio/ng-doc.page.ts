import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsControlsCategory from '../ng-doc.category';
import { RadioExampleComponent } from './radio-example.component';

const RadioPage: NgDocPage = {
  title: 'Radio',
  mdFile: './index.md',
  category: ReactiveFormsControlsCategory,
  order: 4,
  demos: { RadioExampleComponent },
};

export default RadioPage;
